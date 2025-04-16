"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateContent = generateContent;
const generative_ai_1 = require("@google/generative-ai");
const fs_1 = __importDefault(require("fs"));
const models_1 = require("./config/models");
/**
 * Generate content using Google's Gemini API
 * @param params - Parameters for content generation
 * @returns Generated content as a string
 */
async function generateContent(params) {
    const { pdfPath, prompt, preprompt = "", modelType } = params;
    try {
        // Determine which model to use
        const modelToUse = modelType && (0, models_1.isValidModel)(modelType)
            ? modelType
            : (0, models_1.getDefaultModelConfig)().model;
        // Get the location for the model
        const location = (0, models_1.getModelLocation)(modelToUse);
        // Initialize the Google Generative AI client
        const genAI = new generative_ai_1.GoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            projectId: process.env.GOOGLE_PROJECT_ID || "original-bolt-456905-e5",
            location: location
        });
        // Get the model
        const model = genAI.getGenerativeModel({
            model: modelToUse
        });
        // Read the PDF file
        const pdfData = fs_1.default.readFileSync(pdfPath);
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
        // Set up safety settings
        const safetySettings = [
            {
                category: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: generative_ai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: generative_ai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: generative_ai_1.HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE,
            },
        ];
        // Generate content
        const result = await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig,
            safetySettings,
            systemInstruction: preprompt || undefined,
        });
        // Return the response text
        return result.response.text();
    }
    catch (error) {
        console.error('Error in generateContent:', error);
        throw error;
    }
}
