import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { createSessionLogger } from './logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

interface GeminiResponse {
  predictions: Array<{
    bytesBase64Encoded: string;
  }>;
}

export async function generateFourPanel(word: string, sessionId: string): Promise<Buffer> {
  const sessionLogger = createSessionLogger(sessionId);
  sessionLogger.info('Starting 4-panel generation', { word });

  try {
    const panelDescriptions = await generatePanelDescriptions(word, sessionId);
    sessionLogger.info('Generated panel descriptions', {
      word,
      descriptionsLength: panelDescriptions.length
    });

    const imageData = await generateImage(panelDescriptions, sessionId);
    sessionLogger.info('Successfully generated image', { word });

    return imageData;
  } catch (error) {
    sessionLogger.error('Error in generateFourPanel', {
      word,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
}

async function generatePanelDescriptions(word: string, sessionId: string): Promise<string> {
  const sessionLogger = createSessionLogger(sessionId);
  const prompt = `I want you to create a 4-panel representation of the word "${word}" by describing four different scenes that would help someone understand the meaning through visual examples.

Similar to how I might teach the word 'marngle' (meaning steam or hot water vapor) by showing:
1. A lake in the morning with misty vapour wafting off of it.
2. A tea kettle blowing a hazy vapor from the spout.
3. A hot shower making mirrors foggy looking.
4. Freshly cooked dumplings and vegetables with steaming on a plate.

Please create four detailed scene descriptions for "${word}" that would help viewers understand its meaning through visual context. Each scene should show the concept in a different setting, allowing the viewer to identify the common element.

Format your response as a single detailed image prompt that describes a 2x2 grid layout with four panels, each showing one of your scenes. Make the descriptions vivid and specific enough for image generation.

Let's also make sure to keep the images G-rated. We don't want to show anybody not wearing a shirt, or showing extreme negative emotions or acting in a lude manner or violent way.

Finally, please do no try to write large pieces of text onto the image. Maybe a small bit of text in one of the pannels is fine. However, don't use text from any language to describe "${word}"`;

  try {
    sessionLogger.info('Generating panel descriptions', { word });
    sessionLogger.debug('Claude prompt', { prompt });

    // TODO(s.mclaughlin): Why is this line necessary?
    anthropic.apiKey = process.env.ANTHROPIC_API_KEY as string
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      sessionLogger.error('Unexpected response type from Claude', {
        responseType: content.type,
        word
      });
      throw new Error('Unexpected response type from Claude');
    }

    sessionLogger.info('Received Claude response', {
      word,
      responseLength: content.text.length
    });
    return content.text;
  } catch (error) {
    sessionLogger.error('Error generating panel descriptions', {
      word,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
}

async function generateImage(prompt: string, sessionId: string): Promise<Buffer> {
  const sessionLogger = createSessionLogger(sessionId);
  try {
    sessionLogger.info('Starting image generation', {
      promptLength: prompt.length
    });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      sessionLogger.error('GEMINI_API_KEY environment variable is missing');
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    sessionLogger.info('Making request to Gemini API for image generation');
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        instances: [
          {
            prompt: prompt
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    sessionLogger.info('Received response from Gemini API, processing image data');
    const data: GeminiResponse = response.data;

    if (!data.predictions || !data.predictions[0] || !data.predictions[0].bytesBase64Encoded) {
      sessionLogger.error('Invalid response structure from Gemini API', { data });
      throw new Error('Invalid response from Gemini API');
    }

    const base64Data = data.predictions[0].bytesBase64Encoded;
    sessionLogger.info('Successfully generated image', {
      base64DataLength: base64Data.length
    });

    return Buffer.from(base64Data, 'base64');
  } catch (error) {
    sessionLogger.error('Error generating image', {
      error: error instanceof Error ? error.message : error
    });
    if (axios.isAxiosError(error)) {
      sessionLogger.error('Axios error details', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    throw error;
  }
}