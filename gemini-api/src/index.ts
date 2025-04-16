import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { generateContent } from './gemini';
import { getAllModelConfigs, isValidModel } from './config/models';
import { ChatManager } from './chat';
import { authenticate } from './middleware/auth';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure middleware
app.use(express.json());
app.use(authenticate);
app.use(cors());

// Helper function to get client IP
const getClientIp = (req: Request): string => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || '127.0.0.1'; // Fallback to localhost if IP is undefined
};

// Configure file upload
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed') as any, false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// API endpoint to get available models
app.get('/api/models', (req: Request, res: Response) => {
  try {
    const models = getAllModelConfigs();
    res.json({ models });
  } catch (error) {
    console.error('Error getting models:', error);
    res.status(500).json({ error: 'An error occurred while getting models' });
  }
});

// Body: { prompt: string, preprompt?: string, model?: string }
// Files: { pdf: File } (required, max 10MB, PDF only)
app.post('/api/generate', upload.single('pdf'), async (req: Request, res: Response) => {
  try {
    const { prompt, preprompt = "", model } = req.body;
    
    if (!req.file) {
      res.status(400).json({ error: 'PDF file is required' });
      return;
    }
    
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }
    
    if (model && !isValidModel(model)) {
      res.status(400).json({ 
        error: `Invalid model: ${model}. Available models: ${getAllModelConfigs().map(m => m.model).join(', ')}` 
      });
      return;
    }
    
    const pdfPath = req.file.path;
    const result = await generateContent({
      pdfPath,
      prompt,
      preprompt,
      modelType: model
    });
    
    fs.unlinkSync(pdfPath);
    res.json({ result });
  } catch (error: any) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: error.message || 'An error occurred while generating content' });
  }
});

// Chat endpoints
// Body: { model?: string }
// Default model will be used from process.env.DEFAULT_GEMINI_MODEL if not specified
app.post('/api/chat/session', async (req: Request, res: Response) => {
  try {
    const { model = process.env.DEFAULT_GEMINI_MODEL, preprompt="" } = req.body || {};
    const ip = getClientIp(req);
    const chatManager = ChatManager.getInstance();
    const sessionData = await chatManager.createSession(ip, preprompt, model);
    res.json(sessionData);
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({ error: 'An error occurred while creating chat session' });
  }
});

// Body: { message: string }
// Files: { pdf?: File } (optional, max 10MB, PDF only)
// URL params: sessionId
app.post('/api/chat/:sessionId/message', upload.single('pdf'), async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    const ip = getClientIp(req);
    
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const chatManager = ChatManager.getInstance();
    const result = await chatManager.sendMessage(sessionId, ip, message, req.file?.path);
    res.json(result);
  } catch (error: any) {
    console.error('Error sending message:', error);
    if (error.message === 'Chat session not found') {
      res.status(404).json({ error: error.message });
    } else if (error.message === 'IP address mismatch' || error.message === 'Session expired') {
      res.status(403).json({ error: error.message });
    } else if (error.message === 'Failed to process PDF file') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An error occurred while sending message' });
    }
  }
});

app.get('/api/chat/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const ip = getClientIp(req);
    const chatManager = ChatManager.getInstance();
    const sessionData = chatManager.getSession(sessionId, ip);
    
    if (!sessionData) {
      res.status(404).json({ error: 'Chat session not found' });
      return;
    }
    
    res.json(sessionData);
  } catch (error) {
    console.error('Error getting chat session:', error);
    res.status(500).json({ error: 'An error occurred while getting chat session' });
  }
});

app.get('/api/chat', async (req: Request, res: Response) => {
  try {
    const ip = getClientIp(req);
    const chatManager = ChatManager.getInstance();
    const sessions = chatManager.getSessionsByIp(ip);
    res.json(sessions);
  } catch (error) {
    console.error('Error getting chat sessions:', error);
    res.status(500).json({ error: 'An error occurred while getting chat sessions' });
  }
});

app.delete('/api/chat/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const ip = getClientIp(req);
    const chatManager = ChatManager.getInstance();
    const deleted = chatManager.deleteSession(sessionId, ip);
    
    if (!deleted) {
      res.status(404).json({ error: 'Chat session not found' });
      return;
    }
    
    res.json({ message: 'Chat session deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({ error: 'An error occurred while deleting chat session' });
  }
});

app.delete('/api/chat', async (req: Request, res: Response) => {
  try {
    const ip = getClientIp(req);
    const chatManager = ChatManager.getInstance();
    const deletedCount = chatManager.deleteAllSessionsByIp(ip);
    res.json({ message: `Deleted ${deletedCount} chat sessions` });
  } catch (error) {
    console.error('Error deleting chat sessions:', error);
    res.status(500).json({ error: 'An error occurred while deleting chat sessions' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
