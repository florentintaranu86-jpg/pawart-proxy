const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// ══════════════════════════════════════════
//  PROMPTURI — stocate SERVER-SIDE (invizibile pentru client)
// ══════════════════════════════════════════
const PROMPTS = {
  watercolor: "A stunning watercolor portrait of {pet}, artistic brushstrokes, soft pastel colors, white background, professional pet portrait painting, high detail fur texture, warm lighting, 8k quality",
  oilpainting: "A classical oil painting portrait of {pet} in the style of old masters, rich deep colors, dramatic lighting, museum quality, detailed fur, regal pose, baroque style background, 8k",
  royal: "A majestic royal portrait of {pet} wearing a crown and royal robes, sitting on a throne, oil painting style, golden frame background, regal and dignified, photorealistic, 8k quality",
  astronaut: "A heroic portrait of {pet} dressed as a NASA astronaut wearing a white space suit with NASA patches, face clearly visible as main subject, looking at camera, space and Earth in background, photorealistic, 8k",
  pirate: "A swashbuckling portrait of {pet} as a pirate captain, wearing a tricorn hat and pirate coat, ocean and ship in background, dramatic lighting, detailed fur, photorealistic, 8k",
  jedi: "A cinematic portrait of {pet} as a Jedi knight, holding a lightsaber, wearing Jedi robes, dramatic Star Wars lighting, force energy around them, photorealistic, 8k quality",
  fairy: "A magical fairy portrait of {pet} with delicate wings, surrounded by glowing sparkles and flowers, enchanted forest background, soft magical lighting, fantasy art style, 8k",
  angel: "A divine portrait of {pet} as an angel with beautiful white feathered wings, golden halo, heavenly clouds background, soft divine light, serene expression, photorealistic, 8k",
  witch: "A mystical portrait of {pet} as a witch wearing a pointed hat and cape, surrounded by magical potions and candles, moonlit night background, mysterious atmosphere, photorealistic, 8k",
  japanese_princess: "A elegant portrait of {pet} dressed as a Japanese princess in a beautiful kimono with cherry blossoms, traditional Japanese art style mixed with photorealism, soft pink tones, 8k",
  viking: "A fierce portrait of {pet} as a Viking warrior, wearing fur armor and a horned helmet, dramatic Norse landscape background, epic lighting, photorealistic, 8k quality"
};

// ══════════════════════════════════════════
//  ENDPOINT — primește cererea din wizard
// ══════════════════════════════════════════
app.post('/generate', async (req, res) => {
  try {
    const { style_id, image_base64, email, pet_name, special_request } = req.body;

    if (!style_id || !image_base64) {
      return res.status(400).json({ error: 'style_id și image_base64 sunt obligatorii' });
    }

    let prompt = PROMPTS[style_id];
    if (!prompt) {
      return res.status(400).json({ error: 'Stil necunoscut: ' + style_id });
    }

    prompt = prompt.replace('{pet}', pet_name || 'pet');

    const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
    if (!REPLICATE_API_KEY) {
      return res.status(500).json({ error: 'API key lipsă pe server' });
    }

    const replicateRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "a8ff89f2c89255dc26af7c3f5f5ad8a956e4cfc5d1f0283e76b4b009ffcf0e48",
        input: {
          prompt: prompt,
          image: `data:image/jpeg;base64,${image_base64}`,
          num_inference_steps: 30,
          guidance_scale: 7.5
        }
      })
    });

    const prediction = await replicateRes.json();

    if (!prediction.id) {
      return res.status(500).json({ error: 'Eroare Replicate: ' + JSON.stringify(prediction) });
    }

    // Polling
    let result = null;
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2000));

      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Token ${REPLICATE_API_KEY}` }
      });
      const pollData = await pollRes.json();

      if (pollData.status === 'succeeded') {
        result = pollData.output?.[0] || pollData.output;
        break;
      }
      if (pollData.status === 'failed') {
        return res.status(500).json({ error: 'Generare eșuată: ' + pollData.error });
      }
    }

    if (!result) {
      return res.status(500).json({ error: 'Timeout — încearcă din nou' });
    }

    res.json({ image_url: result });

  } catch (err) {
    console.error('Eroare server:', err);
    res.status(500).json({ error: 'Eroare internă: ' + err.message });
  }
});

app.get('/', (req, res) => res.json({ status: 'PawArt Proxy OK 🐾' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PawArt Proxy rulează pe portul ${PORT}`));
