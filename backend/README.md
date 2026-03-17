# Backend API for PromptSharp

This is the backend API server for PromptSharp, providing prompt optimization services.

## Setup

1. Install dependencies:
```
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
OPENROUTER_API_KEY=your_openrouter_api_key
```

3. Start the development server:
```
npm run dev
```

## API Endpoints

### POST /api/optimize
Optimizes a user prompt using AI.

**Request Body:**
```json
{
  "prompt": "Your prompt text here"
}
```

**Response:**
```json
{
  "original": "Original prompt",
  "optimized": "Optimized prompt"
}
```

## Error Handling

The API implements robust error handling with appropriate HTTP status codes and error messages.

## Rate Limiting

The API implements rate limiting to prevent abuse (10 requests/minute per IP).
