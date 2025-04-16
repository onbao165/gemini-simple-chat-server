# Gemini API Service

A TypeScript/Node.js API service that processes PDF files using Google's Gemini AI models, similar to the functionality in `gemini-chat.py`.

## Features

- API endpoint for generating content from PDF files
- API key authentication
- PDF file upload and processing
- Integration with Google's Gemini AI
- Support for multiple Gemini models with automatic location mapping
- Type-safe implementation with TypeScript
- Chat session management
- Ngrok integration for public access

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Google Cloud project with Gemini API enabled
- Docker and Docker Compose (optional)

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

## Docker Deployment

1. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

2. Access the API through:
   - Local: http://localhost:3000
   - Ngrok: https://your-domain.ngrok-free.app (if configured)

3. Monitor ngrok status:
   ```bash
   # View ngrok web interface
   open http://localhost:4040
   
   # Check ngrok logs
   docker-compose logs -f ngrok
   ```

## API Documentation

### Authentication

All endpoints require the `x-api-key` header with your API key.

### File Management

#### Upload File

**Endpoint:** `POST /api/files`

**Headers:**
- `x-api-key`: Your API key (required)

**Form Data:**
- `file`: PDF file (required, max 10MB)

**Response:**
```json
{
  "filename": "1234567890-document.pdf",
  "path": "/app/uploads/1234567890-document.pdf",
  "size": 1234567
}
```

#### List Files

**Endpoint:** `GET /api/files`

**Headers:**
- `x-api-key`: Your API key (required)

**Response:**
```json
{
  "files": [
    {
      "filename": "document1.pdf",
      "path": "/app/uploads/document1.pdf",
      "size": 1234567,
      "uploadedAt": "2024-03-20T10:00:00Z"
    }
  ]
}
```

#### Delete File

**Endpoint:** `DELETE /api/files/:filename`

**Headers:**
- `x-api-key`: Your API key (required)

**Response:**
```json
{
  "message": "File deleted successfully"
}
```

### Generate Content

Now supports two modes of operation:

1. Direct file upload:
```
POST /api/generate
Content-Type: multipart/form-data
x-api-key: your-api-key

file: <pdf_file>
prompt: "your prompt"
```

2. Using previously uploaded file:
```
POST /api/generate
Content-Type: application/json
x-api-key: your-api-key

{
  "filename": "previously-uploaded.pdf",
  "prompt": "your prompt"
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
      "model": "gemini-2.5-pro-preview-03-25",
      "location": "global"
    },
    {
      "model": "gemini-2.0-flash-001",
      "location": "global"
    },
    {
      "model": "gemini-2.0-flash-lite-001",
      "location": "global"
    },
    {
      "model": "gemini-2.0-flash-thinking-exp-01-21",
      "location": "global"
    },
    {
      "model": "gemini-1.5-flash-002",
      "location": "asia-southeast1"
    },
    {
      "model": "gemini-1.5-pro-002",
      "location": "global"
    }
  ]
}
```

### Chat Sessions

#### Create Chat Session

**Endpoint:** `POST /api/chat/session`

**Headers:**
- `x-api-key`: Your API key (required)

**Body:**
```json
{
  "model": "gemini-2.0-flash-001",  // optional
  "preprompt": "System instruction"  // optional
}
```

**Response:**
```json
{
  "sessionId": "unique-session-id",
  "model": "gemini-2.0-flash-001",
  "created": "2024-03-20T10:00:00Z"
}
```

#### Get Chat Session

**Endpoint:** `GET /api/chat/:sessionId`

**Headers:**
- `x-api-key`: Your API key (required)

**Response:**
```json
{
  "sessionId": "unique-session-id",
  "model": "gemini-2.0-flash-001",
  "created": "2024-03-20T10:00:00Z",
  "messages": []
}
```

#### List Chat Sessions

**Endpoint:** `GET /api/chat`

**Headers:**
- `x-api-key`: Your API key (required)

**Response:**
```json
[
  {
    "sessionId": "session-1",
    "model": "gemini-2.0-flash-001",
    "created": "2024-03-20T10:00:00Z"
  },
  // ...
]
```

#### Delete All Chat Sessions

**Endpoint:** `DELETE /api/chat`

**Headers:**
- `x-api-key`: Your API key (required)

**Response:**
```json
{
  "message": "Deleted X chat sessions"
}
```

### Chat Messages

Similarly supports both direct upload and referencing existing files:

1. Direct file upload:
```
POST /api/chat/:sessionId/message
Content-Type: multipart/form-data
x-api-key: your-api-key

pdf: <pdf_file>
message: "your message"
```

2. Using previously uploaded file:
```
POST /api/chat/:sessionId/message
Content-Type: application/json
x-api-key: your-api-key

{
  "filename": "previously-uploaded.pdf",
  "message": "your message"
}
```

## Environment Variables

```env
# Server configuration
PORT=3000
NGROK_AUTHTOKEN=your_ngrok_authtoken

# API authentication
API_KEY=your_api_key

# Google Gemini configuration
GOOGLE_API_KEY=your_google_api_key
GOOGLE_PROJECT_ID=your_google_project_id

# Default model configuration
DEFAULT_GEMINI_MODEL=gemini-2.0-flash-lite-001

# Optional system preprompt
DEFAULT_PREPROMPT=your_default_system_instruction
```

## Available Models

- `gemini-2.5-pro-preview-03-25` (Location: global)
- `gemini-2.0-flash-001` (Location: global)
- `gemini-2.0-flash-lite-001` (Location: global)
- `gemini-2.0-flash-thinking-exp-01-21` (Location: global)
- `gemini-1.5-flash-002` (Location: asia-southeast1)
- `gemini-1.5-pro-002` (Location: global)

## License

ISC


