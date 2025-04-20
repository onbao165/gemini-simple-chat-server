# Gemini API Service

A TypeScript/Node.js API service that processes PDF files using Google's Gemini AI models.

## Features

- API endpoint for generating content from PDF files
- API key authentication with support for:
  - Global API key for service-level access control
  - Per-session custom Google API keys for individual Gemini access
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

All endpoints require the `x-api-key` header with your service API key for access control.

Additionally, you can provide a custom Google API key for Gemini access in the following endpoints:

#### Generate Content
```http
POST /api/generate
Content-Type: application/json
x-api-key: your-service-api-key

{
  "filename": "previously-uploaded.pdf",
  "prompt": "your prompt",
  "apiKey": "your-custom-google-api-key"  // Optional: Custom Gemini API key
}
```

#### Create Chat Session
```http
POST /api/chat/session
Content-Type: application/json
x-api-key: your-service-api-key

{
  "model": "gemini-2.0-flash-001",  // optional
  "preprompt": "System instruction",  // optional
  "apiKey": "your-custom-google-api-key"  // optional: Custom Gemini API key
}
```

When a custom Google API key is provided:
- It will be used exclusively for that session's Gemini API calls
- The key is securely stored with the session
- Sessions are isolated by IP address and session ID
- The key persists throughout the session's lifetime
- When no custom key is provided, the default GOOGLE_API_KEY from environment variables is used

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

Supports two modes of operation with optional custom API key:

1. Direct file upload:
```
POST /api/generate
Content-Type: multipart/form-data
x-api-key: your-api-key

file: <pdf_file>
prompt: "your prompt"
preprompt: "optional system instruction"
model: "optional model name"
apiKey: "your-custom-google-api-key"  // Optional: Custom Gemini API key
```

2. Using previously uploaded file:
```
POST /api/generate
Content-Type: application/json
x-api-key: your-api-key

{
  "filename": "previously-uploaded.pdf",
  "prompt": "your prompt",
  "preprompt": "optional system instruction",
  "model": "optional model name",
  "apiKey": "your-custom-google-api-key"  // Optional: Custom Gemini API key
}
```

The generate endpoint allows:
- One-time use of a custom Google API key for a single generation
- Model selection for specific generation requirements
- Optional preprompt/system instruction
- Both direct file upload and reference to existing files

### List Models

**Endpoint:** `GET /api/models`

**Headers:**
- `x-api-key`: Your API key (required)

**Response:**
```json
{
  "models": [
    {
      "model": "gemini-2.5-flash-preview-04-17",
      "location": "global"
    },
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
      "model": "gemini-1.5-flash",
      "location": "asia-southeast1"
    },
    {
      "model": "gemini-1.5-pro",
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
  "preprompt": "System instruction",  // optional
  "apiKey": "your-custom-google-api-key"  // optional: Custom Gemini API key
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

Note: The API key handling differs between endpoints:
- `/api/generate`: Accepts a custom API key for one-time use
- `/api/chat/session`: Custom API key persists for the entire session
- Chat messages automatically use the session's API key

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

Similarly supports both direct upload and referencing existing files, with custom API key support:

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

Note: When sending messages to a chat session, the system automatically uses:
- The custom Google API key provided during session creation (if any)
- The default GOOGLE_API_KEY if no custom key was provided

This ensures consistent API key usage throughout the entire chat session lifecycle.

## Configuration

### CORS Settings
The API supports Cross-Origin Resource Sharing (CORS) with the following default configuration:
- All origins allowed (`*`)
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Allowed headers: Content-Type, x-api-key, Authorization
- Exposed headers: Content-Range, X-Content-Range

To restrict CORS in production, modify the origin in your `.env`:
```env
CORS_ORIGIN=https://your-domain.com
```

## Environment Variables

```env
# Server configuration
PORT=3000
NGROK_AUTHTOKEN=your_ngrok_authtoken

# API authentication
API_KEY=your_service_api_key  # Required: For service access control

# Google Gemini configuration
GOOGLE_API_KEY=your_google_api_key  # Default Gemini API key
GOOGLE_PROJECT_ID=your_google_project_id

# Default model configuration
DEFAULT_GEMINI_MODEL=gemini-2.0-flash-lite-001

# Optional system preprompt
DEFAULT_PREPROMPT=your_default_system_instruction
```

## Available Models

- `gemini-2.5-flash-preview-04-17` (Location: global)
- `gemini-2.5-pro-preview-03-25` (Location: global)
- `gemini-2.0-flash-001` (Location: global)
- `gemini-2.0-flash-lite-001` (Location: global)
- `gemini-1.5-flash` (Location: asia-southeast1)
- `gemini-1.5-pro` (Location: global)

## License

ISC







