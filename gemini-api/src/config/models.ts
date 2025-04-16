/**
 * Model configuration for Gemini API
 * Defines the available models and their corresponding locations
 */

// Define the model type
export type GeminiModelType = 
  | 'gemini-2.5-pro-preview-03-25'
  | 'gemini-2.0-flash-001'
  | 'gemini-2.0-flash-lite-001'
  | 'gemini-2.0-flash-thinking-exp-01-21'
  | 'gemini-1.5-flash-002'
  | 'gemini-1.5-pro-002'

// Define the location type
export type GeminiLocationType = 
  | 'global'
  | 'asia-southeast1';

// Define the model configuration interface
export interface GeminiModelConfig {
  model: GeminiModelType;
  location: GeminiLocationType;
}

// Define the available models and their locations
export const GEMINI_MODELS: Record<GeminiModelType, GeminiLocationType> = {
  'gemini-2.5-pro-preview-03-25': 'global',
  'gemini-2.0-flash-thinking-exp-01-21': 'global',
  'gemini-2.0-flash-001': 'global',
  'gemini-2.0-flash-lite-001': 'global',
  'gemini-1.5-flash-002': 'asia-southeast1',
  'gemini-1.5-pro-002': 'global'
};

/**
 * Get the location for a given model
 * @param model The model name
 * @returns The location for the model
 * @throws Error if the model is not supported
 */
export function getModelLocation(model: string): GeminiLocationType {
  if (!isValidModel(model)) {
    throw new Error(`Unsupported model: ${model}. Supported models are: ${Object.keys(GEMINI_MODELS).join(', ')}`);
  }
  
  return GEMINI_MODELS[model as GeminiModelType];
}

/**
 * Check if a model is supported
 * @param model The model name to check
 * @returns True if the model is supported, false otherwise
 */
export function isValidModel(model: string): model is GeminiModelType {
  return Object.keys(GEMINI_MODELS).includes(model);
}

/**
 * Get all available models with their locations
 * @returns An array of model configurations
 */
export function getAllModelConfigs(): GeminiModelConfig[] {
  return Object.entries(GEMINI_MODELS).map(([model, location]) => ({
    model: model as GeminiModelType,
    location: location
  }));
}

/**
 * Get the default model configuration
 * @returns The default model configuration
 */
export function getDefaultModelConfig(): GeminiModelConfig {
  const defaultModel = process.env.DEFAULT_GEMINI_MODEL as GeminiModelType || 'gemini-2.0-flash-001';
  return {
    model: defaultModel,
    location: GEMINI_MODELS[defaultModel]
  };
}
