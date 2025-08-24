import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { generateFourPanel } from './fourPanelService';
import { logger, createSessionLogger } from './logger';

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/v1/make4pannel', async (req: Request, res: Response) => {
  const sessionId = uuidv4();
  const sessionLogger = createSessionLogger(sessionId);
  const startTime = Date.now();
  
  sessionLogger.info('Received request for 4-panel generation', {
    timestamp: new Date().toISOString(),
    endpoint: '/api/v1/make4pannel'
  });

  try {
    const { word } = req.query;
    sessionLogger.info('Request query parameters', { query: req.query });

    if (!word || typeof word !== 'string') {
      sessionLogger.warn('Invalid word parameter received', {
        word,
        wordType: typeof word
      });
      return res.status(400).json({ error: 'Word parameter is required' });
    }

    sessionLogger.info('Processing 4-panel generation request', { word });
    const imageData = await generateFourPanel(word, sessionId);

    const duration = Date.now() - startTime;
    sessionLogger.info('Successfully generated 4-panel', {
      word,
      duration: `${duration}ms`
    });

    res.setHeader('Content-Type', 'image/png');
    res.send(imageData);
  } catch (error) {
    const duration = Date.now() - startTime;
    sessionLogger.error('Error generating 4-panel', {
      duration: `${duration}ms`,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    });

    res.status(500).json({ error: 'Failed to generate 4-panel representation' });
  }
});

app.listen(PORT, () => {
  logger.info('4Panel service started', { port: PORT });
});