import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Tool } from '@google/generative-ai';
import fs from 'fs';
import { getModelLocation, isValidModel, getDefaultModelConfig, GeminiModelType } from './config/models';

/**
 * Interface for content generation parameters
 */
export interface GenerateContentParams {
  pdfPath: string;
  prompt: string;
  preprompt?: string;
  modelType?: string;
}

/**
 * Generate content using Google's Gemini API
 * @param params - Parameters for content generation
 * @returns Generated content as a string
 */
export async function generateContent(params: GenerateContentParams): Promise<string> {
  const { pdfPath, prompt, preprompt = "", modelType } = params;
  
  try {
    // Determine which model to use
    const modelToUse = modelType && isValidModel(modelType) 
      ? modelType as GeminiModelType
      : getDefaultModelConfig().model;
    
    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);


    // Get the model
    const model = genAI.getGenerativeModel({
      model: modelToUse
    });

    // Read the PDF file
    const pdfData = fs.readFileSync(pdfPath);

    // Convert PDF to base64
    const pdfBase64 = pdfData.toString('base64');

    // Create the content parts
    const parts = [
      { text: prompt },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64
        }
      }
    ];

    // Set up generation config
    const generationConfig = {
      maxOutputTokens: 8192,
      temperature: 1,
      topP: 0.95,
    };

    // Search Grounding is supported only for text-only requests.
    // const tools: Tool[] = [
    //   { googleSearchRetrieval: {} },
    // ];

    // Set up safety settings
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

    // Generate content
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig,
      safetySettings,
      // tools,
      systemInstruction: preprompt || process.env.DEFAULT_PREPROMPT || undefined,
    });

    // Return the response text
    return result.response.text();
  } catch (error) {
    console.error('Error in generateContent:', error);
    throw error;
  }
}



