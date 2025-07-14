require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3001;

const CLIPDROP_API_KEY = process.env.CLIPDROP_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || prompt.length < 3) {
      return res.status(400).json({ error: "Prompt too short" });
    }

    const pixelPrompt = `pixel art style, ${prompt}`;
    const requestBody = JSON.stringify({ prompt: pixelPrompt });

    const clipRes = await fetch('https://clipdrop-api.co/text-to-image/v1', {
      method: 'POST',
      headers: {
        'x-api-key': CLIPDROP_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody).toString()
      },
      body: requestBody
    });

    if (!clipRes.ok) {
      const err = await clipRes.text();
      console.error("ClipDrop Error:", err);
      return res.status(500).json({ error: "ClipDrop failed", details: err });
    }

    const arrayBuffer = await clipRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    res.json({ image: `data:image/jpeg;base64,${base64Image}` });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ ClipDrop backend running at http://localhost:${PORT}`);
});
