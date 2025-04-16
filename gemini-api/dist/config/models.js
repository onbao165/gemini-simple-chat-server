"use strict";
/**
 * Model configuration for Gemini API
 * Defines the available models and their corresponding locations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GEMINI_MODELS = void 0;
exports.getModelLocation = getModelLocation;
exports.isValidModel = isValidModel;
exports.getAllModelConfigs = getAllModelConfigs;
exports.getDefaultModelConfig = getDefaultModelConfig;
// Define the available models and their locations
exports.GEMINI_MODELS = {
    'gemini-2.0-flash-001': 'global',
    'gemini-2.0-flash-lite-001': 'global',
    'gemini-1.5-flash-002': 'asia-southeast1'
};
/**
 * Get the location for a given model
 * @param model The model name
 * @returns The location for the model
 * @throws Error if the model is not supported
 */
function getModelLocation(model) {
    if (!isValidModel(model)) {
        throw new Error(`Unsupported model: ${model}. Supported models are: ${Object.keys(exports.GEMINI_MODELS).join(', ')}`);
    }
    return exports.GEMINI_MODELS[model];
}
/**
 * Check if a model is supported
 * @param model The model name to check
 * @returns True if the model is supported, false otherwise
 */
function isValidModel(model) {
    return Object.keys(exports.GEMINI_MODELS).includes(model);
}
/**
 * Get all available models with their locations
 * @returns An array of model configurations
 */
function getAllModelConfigs() {
    return Object.entries(exports.GEMINI_MODELS).map(([model, location]) => ({
        model: model,
        location: location
    }));
}
/**
 * Get the default model configuration
 * @returns The default model configuration
 */
function getDefaultModelConfig() {
    const defaultModel = process.env.DEFAULT_GEMINI_MODEL || 'gemini-2.0-flash-001';
    return {
        model: defaultModel,
        location: exports.GEMINI_MODELS[defaultModel]
    };
}
