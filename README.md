# 4Panel Service

## TODO

- Sanitize prompt injections
- Tests
- Frontend
- Add an API key before the service goes live

A TypeScript service that generates 4-panel visual representations of words to help illustrate their meaning through contextual examples.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy the environment file and add your API keys:
```bash
cp .env.example .env
```

3. Add your API keys to `.env`:
- `ANTHROPIC_API_KEY`: Your Anthropic Claude API key
- `GEMINI_API_KEY`: Your Google Gemini API key

## Usage

### Development
```bash
npm run dev
```

### Build and Run
```bash
npm run build
npm start
```

## API

### GET /api/v1/make4pannel?word={word}

Generates a 4-panel PNG image that illustrates the meaning of the provided word through four different contextual scenes.

**Parameters:**
- `word` (string, required): The word to create a 4-panel representation for

**Response:**
- Content-Type: `image/png`
- Body: PNG image data

**Example:**
```
GET /api/v1/make4pannel?word=steam
```

Returns a PNG image showing four panels that illustrate the concept of steam in different contexts.

## How It Works

1. **Step 1**: Uses Claude (claude-opus-4-20250514) to generate detailed descriptions of four different scenes that showcase the word's meaning
2. **Step 2**: Sends the generated prompt to Gemini's image generation API (imagen-3.0-generate-002)
3. **Step 3**: Extracts the base64-encoded image data and returns it as a PNG

The service follows the concept of teaching through visual examples - like showing four different contexts where "steam" appears to help viewers understand the concept without explicitly defining it.