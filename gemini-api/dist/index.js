"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const gemini_1 = require("./gemini");
const auth_1 = require("./middleware/auth");
const models_1 = require("./config/models");
// Load environment variables
dotenv_1.default.config();
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Configure middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Configure file upload
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            const uploadDir = path_1.default.join(__dirname, '../uploads');
            if (!fs_1.default.existsSync(uploadDir)) {
                fs_1.default.mkdirSync(uploadDir, { recursive: true });
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
        }
        else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});
// API endpoint to get available models
app.get('/api/models', auth_1.authenticate, (req, res) => {
    try {
        const models = (0, models_1.getAllModelConfigs)();
        return res.json({ models });
    }
    catch (error) {
        console.error('Error getting models:', error);
        return res.status(500).json({ error: 'An error occurred while getting models' });
    }
});
// API endpoint for generating content
app.post('/api/generate', auth_1.authenticate, upload.single('pdf'), async (req, res) => {
    try {
        const { prompt, preprompt = "", model } = req.body;
        // Validate request
        if (!req.file) {
            return res.status(400).json({ error: 'PDF file is required' });
        }
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        // Validate model if provided
        if (model && !(0, models_1.isValidModel)(model)) {
            return res.status(400).json({
                error: `Invalid model: ${model}. Available models: ${(0, models_1.getAllModelConfigs)().map(m => m.model).join(', ')}`
            });
        }
        // Generate content
        const pdfPath = req.file.path;
        const result = await (0, gemini_1.generateContent)({
            pdfPath,
            prompt,
            preprompt,
            modelType: model
        });
        // Clean up the uploaded file
        fs_1.default.unlinkSync(pdfPath);
        // Return the result
        return res.json({ result });
    }
    catch (error) {
        console.error('Error generating content:', error);
        return res.status(500).json({ error: error.message || 'An error occurred while generating content' });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
