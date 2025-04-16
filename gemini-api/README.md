# Gemini API Service

A TypeScript/Node.js API service that processes PDF files using Google's Gemini AI models, similar to the functionality in `gemini-chat.py`.

## Features

- API endpoint for generating content from PDF files
- API key authentication
- PDF file upload and processing
- Integration with Google's Gemini AI
- Support for multiple Gemini models with automatic location mapping
- Type-safe implementation with TypeScript

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Google Cloud project with Gemini API enabled

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```
4. Edit the `.env` file and set your API key and other configuration options
5. Build the TypeScript code:
   ```
   npm run build
   ```

## Usage

1. Start the server:
   ```
   npm start
   ```

2. For development with auto-reload:
   ```
   npm run dev:watch
   ```

3. Make a request to the API endpoint:
   ```
   curl -X POST \
     http://localhost:3000/api/generate \
     -H 'x-api-key: your_api_key_here' \
     -F 'pdf=@/path/to/your/file.pdf' \
     -F 'prompt=Your prompt here' \
     -F 'preprompt=Optional system instruction' \
     -F 'model=gemini-2.0-flash-001'
   ```

4. List available models:
   ```
   curl -X GET \
     http://localhost:3000/api/models \
     -H 'x-api-key: your_api_key_here'
   ```

5. Use the test script:
   ```
   # Run with default model
   npx ts-node test-api.ts /path/to/your/file.pdf "Your prompt here"

   # Run with specific model
   npx ts-node test-api.ts /path/to/your/file.pdf "Your prompt here" gemini-2.0-flash-001

   # List available models
   npx ts-node test-api.ts --list-models
   ```

## API Documentation

### Generate Content

**Endpoint:** `POST /api/generate`

**Headers:**
- `x-api-key`: Your API key (required)

**Form Data:**
- `pdf`: PDF file (required)
- `prompt`: Text prompt for Gemini (required)
- `preprompt`: System instruction (optional)
- `model`: Gemini model to use (optional, defaults to the value in .env)

**Response:**
```json
{
  "result": "Generated content from Gemini..."
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

### List Models

**Endpoint:** `GET /api/models`

**Headers:**
- `x-api-key`: Your API key (required)

**Response:**
```json
{
  "models": [
    {
      "model": "gemini-2.0-flash-001",
      "location": "global"
    },
    {
      "model": "gemini-2.0-flash-lite-001",
      "location": "global"
    },
    {
      "model": "gemini-1.5-flash-002",
      "location": "asia-southeast1"
    }
  ]
}
```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `API_KEY`: API key for authentication
- `GOOGLE_API_KEY`: Google API key for Gemini
- `GOOGLE_PROJECT_ID`: Google Cloud project ID
- `DEFAULT_GEMINI_MODEL`: Default Gemini model to use when none is specified

## License

ISC
