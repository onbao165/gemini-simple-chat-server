import { GoogleGenerativeAI, ChatSession, Content, Part, HarmCategory, HarmBlockThreshold, Tool } from '@google/generative-ai';
import { getModelLocation, isValidModel, getDefaultModelConfig, GeminiModelType } from './config/models';
import fs from 'fs';

export interface ChatSessionData {
  sessionId: string;
  model: string;
  history: Content[];
  createdAt: Date;
  lastAccessed: Date;
  ip: string;
  expiresAt: Date;
  totalTokens: number;
}

export interface MessageResponse {
  response: string;
  sessionData: ChatSessionData;
  tokenCount: {
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
  };
}

export class ChatManager {
  private static instance: ChatManager;
  private sessions: Map<string, { session: ChatSession; data: ChatSessionData; model: any }>;
  private genAI: GoogleGenerativeAI;
  private readonly SESSION_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

  private constructor() {
    this.sessions = new Map();
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);
    // Start cleanup interval
    this.startCleanupInterval();
  }

  private startCleanupInterval() {
    // Run cleanup every 5 minutes
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }

  private cleanupExpiredSessions() {
    const now = new Date();
    for (const [sessionId, sessionData] of this.sessions.entries()) {
      if (sessionData.data.expiresAt < now) {
        this.sessions.delete(sessionId);
      }
    }
  }

  public static getInstance(): ChatManager {
    if (!ChatManager.instance) {
      ChatManager.instance = new ChatManager();
    }
    return ChatManager.instance;
  }

  public async createSession(ip: string, preprompt?: string, modelType?: string): Promise<ChatSessionData> {
    // Clean up any existing sessions for this IP
    this.cleanupSessionsByIp(ip);

    // Determine which model to use
    const modelToUse = modelType && isValidModel(modelType) 
      ? modelType as GeminiModelType
      : getDefaultModelConfig().model;

    // Get the model
    const model = this.genAI.getGenerativeModel({
      model: modelToUse
    });

    // Add safety settings
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ];

    // Add generation config
    const generationConfig = {
      maxOutputTokens: 8192,
      temperature: 1,
      topP: 0.95,
    };

    // Add tools
    // Search Grounding is supported only for text-only requests.
    // const tools = [
    //   { googleSearchRetrieval: {} },
    // ];

    // Create new chat session
    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      systemInstruction: preprompt || process.env.DEFAULT_PREPROMPT || '',
      // tools,
    });

    // Create session data
    const now = new Date();
    const sessionId = Date.now().toString();
    const sessionData: ChatSessionData = {
      sessionId,
      model: modelToUse,
      history: [],
      createdAt: now,
      lastAccessed: now,
      ip,
      expiresAt: new Date(now.getTime() + this.SESSION_TTL_MS),
      totalTokens: 0
    };

    // Store session
    this.sessions.set(sessionId, { session: chatSession, data: sessionData, model });

    return sessionData;
  }

  private cleanupSessionsByIp(ip: string) {
    for (const [sessionId, sessionData] of this.sessions.entries()) {
      if (sessionData.data.ip === ip) {
        this.sessions.delete(sessionId);
      }
    }
  }

  public async sendMessage(sessionId: string, ip: string, message: string, pdfPath?: string): Promise<MessageResponse> {
    const sessionData = this.sessions.get(sessionId);
    if (!sessionData) {
      throw new Error('Chat session not found');
    }

    // Verify IP matches
    if (sessionData.data.ip !== ip) {
      throw new Error('IP address mismatch');
    }

    // Check if session is expired
    if (sessionData.data.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      throw new Error('Session expired');
    }

    // Update last accessed time and extend TTL
    const now = new Date();
    sessionData.data.lastAccessed = now;
    sessionData.data.expiresAt = new Date(now.getTime() + this.SESSION_TTL_MS);

    // Prepare message parts
    const parts: Part[] = [{ text: message }];

    // Add PDF if provided
    if (pdfPath) {
      try {
        const pdfData = fs.readFileSync(pdfPath);
        const pdfBase64 = pdfData.toString('base64');
        parts.push({
          inlineData: {
            mimeType: "application/pdf",
            data: pdfBase64
          }
        });
      } catch (error) {
        console.error('Error reading PDF file:', error);
        throw new Error('Failed to process PDF file');
      }
    }

    // Count tokens for the prompt
    const promptTokenCount = await sessionData.model.countTokens({ contents: [{ role: "user", parts }] });
    const promptTokens = promptTokenCount.totalTokens;

    // Send message with configurations
    const result = await sessionData.session.sendMessage(parts);
    const response = result.response.text();

    // Count tokens for the response
    const responseTokenCount = await sessionData.model.countTokens(response);
    const responseTokens = responseTokenCount.totalTokens;

    // Update total tokens
    const totalTokens = promptTokens + responseTokens;
    sessionData.data.totalTokens += totalTokens;

    // Update history
    const history = await sessionData.session.getHistory();
    sessionData.data.history = history;

    // Clean up PDF file if it was provided
    if (pdfPath) {
      try {
        fs.unlinkSync(pdfPath);
      } catch (error) {
        console.error('Error deleting PDF file:', error);
      }
    }

    return {
      response,
      sessionData: sessionData.data,
      tokenCount: {
        promptTokens,
        responseTokens,
        totalTokens
      }
    };
  }

  public getSession(sessionId: string, ip: string): ChatSessionData | undefined {
    const sessionData = this.sessions.get(sessionId);
    if (!sessionData || sessionData.data.ip !== ip) {
      return undefined;
    }
    return sessionData.data;
  }

  public getSessionsByIp(ip: string): ChatSessionData[] {
    return Array.from(this.sessions.values())
      .filter(s => s.data.ip === ip)
      .map(s => s.data);
  }

  public deleteSession(sessionId: string, ip: string): boolean {
    const sessionData = this.sessions.get(sessionId);
    if (!sessionData || sessionData.data.ip !== ip) {
      return false;
    }
    return this.sessions.delete(sessionId);
  }

  public deleteAllSessionsByIp(ip: string): number {
    let deletedCount = 0;
    for (const [sessionId, sessionData] of this.sessions.entries()) {
      if (sessionData.data.ip === ip) {
        this.sessions.delete(sessionId);
        deletedCount++;
      }
    }
    return deletedCount;
  }
} 