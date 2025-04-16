"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
/**
 * Authentication middleware to protect API endpoints
 * Uses a simple API key authentication mechanism
 */
const authenticate = (req, res, next) => {
    // Get the API key from the request header
    const apiKey = req.headers['x-api-key'];
    // Get the expected API key from environment variables
    const expectedApiKey = process.env.API_KEY;
    // Check if the API key is provided and matches the expected key
    if (!apiKey) {
        res.status(401).json({ error: 'API key is required' });
        return;
    }
    if (apiKey !== expectedApiKey) {
        res.status(403).json({ error: 'Invalid API key' });
        return;
    }
    // If authentication is successful, proceed to the next middleware
    next();
};
exports.authenticate = authenticate;
