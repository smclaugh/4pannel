import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface GeminiResponse {
  predictions: Array<{
    bytesBase64Encoded: string;
  }>;
}

export async function generateFourPanel(word: string): Promise<Buffer> {
  const panelDescriptions = await generatePanelDescriptions(word);
  const imageData = await generateImage(panelDescriptions);
  return imageData;
}

async function generatePanelDescriptions(word: string): Promise<string> {
  const prompt = `I want you to create a 4-panel representation of the word "${word}" by describing four different scenes that would help someone understand the meaning through visual examples.

Similar to how I might teach the word 'marngle' (meaning steam or hot water vapor) by showing:
1. A lake in the morning with misty vapour wafting off of it.
2. A tea kettle blowing a hazy vapor from the spout.
3. A hot shower making mirrors foggy looking.
4. Freshly cooked dumplings and vegetables with steaming on a plate.

Please create four detailed scene descriptions for "${word}" that would help viewers understand its meaning through visual context. Each scene should show the concept in a different setting, allowing the viewer to identify the common element.

Format your response as a single detailed image prompt that describes a 2x2 grid layout with four panels, each showing one of your scenes. Make the descriptions vivid and specific enough for image generation.`;

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  return content.text;
}

async function generateImage(prompt: string): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

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

  const data: GeminiResponse = response.data;
  
  if (!data.predictions || !data.predictions[0] || !data.predictions[0].bytesBase64Encoded) {
    throw new Error('Invalid response from Gemini API');
  }

  const base64Data = data.predictions[0].bytesBase64Encoded;
  return Buffer.from(base64Data, 'base64');
}