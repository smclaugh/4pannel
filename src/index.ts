import express, { Request, Response } from 'express';
import cors from 'cors';
import { generateFourPanel } from './fourPanelService';

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/v1/make4pannel', async (req: Request, res: Response) => {
  try {
    const { word } = req.query;

    if (!word || typeof word !== 'string') {
      return res.status(400).json({ error: 'Word parameter is required' });
    }

    const imageData = await generateFourPanel(word);

    res.setHeader('Content-Type', 'image/png');
    res.send(imageData);
  } catch (error) {
    console.error('Error generating 4-panel:', error);
    res.status(500).json({ error: 'Failed to generate 4-panel representation' });
  }
});

app.listen(PORT, () => {
  console.log(`4Panel service listening on port ${PORT}`);
});