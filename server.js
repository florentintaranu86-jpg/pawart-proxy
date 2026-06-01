
const express = require('express');
const cors = require('cors');
const app = express();
 
app.use(cors());
app.use(express.json({ limit: '20mb' }));
 
// ══════════════════════════════════════════
//  RATE LIMITING — max 10 generări/IP/oră
// ══════════════════════════════════════════
const rateLimitMap = new Map();
 
function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.ip;
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000; // 24 ore
  const maxRequests = 3; // max 3 generări per IP per zi
 
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }
 
  const data = rateLimitMap.get(ip);
 
  if (now > data.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }
 
  if (data.count >= maxRequests) {
    return res.status(429).json({
      error: 'Prea multe generări. Încearcă din nou peste o oră.'
    });
  }
 
  data.count++;
  next();
}
 
// ══════════════════════════════════════════
//  PROMPTURI REALE — 100% server-side, invizibile
// ══════════════════════════════════════════
const PROMPTS = {
  gentleman: "Bust portrait, cropped at mid-chest, no legs or paws visible in frame. The animal from the reference image wearing a distinguished black Victorian tailcoat with a crisp white dress shirt and silk bow tie, a classic black top hat tilted slightly on the head. Warm soft study lamp lighting, blurred Victorian library with leather-bound books in the background. CRITICAL FACE: The animal's face is an exact photorealistic likeness of the reference photo — same eye color, eye shape, fur color, fur pattern, facial proportions, nose and markings. Face identical to reference. Only costume and background change, never the face or fur. Professional portrait photography, photorealistic, sharp focus on the face, shallow depth of field, 8k.",
 
  rege: "Bust portrait, cropped at mid-chest, no legs or paws visible in frame. The animal from the reference image wearing an elaborate golden crown with rubies and a rich crimson velvet royal robe with golden trim and white fur collar. Warm dramatic candlelight lighting, blurred royal palace interior with marble pillars and velvet curtains in the background. CRITICAL FACE: The animal's face is an exact photorealistic likeness of the reference photo — same eye color, eye shape, fur color, fur pattern, facial proportions, nose and markings. Face identical to reference. Only costume and background change, never the face or fur. Professional portrait photography, photorealistic, sharp focus on the face, shallow depth of field, 8k.",
 
  pirat: "Bust portrait, cropped at mid-chest, no legs or paws visible in frame. The animal from the reference image wearing a weathered tricorn hat with a small feather and a leather coat with gold buttons, a red neckerchief visible at the collar. Dramatic warm golden sunset lighting, blurred ocean horizon with tall ship masts in the background. CRITICAL FACE: The animal's face is an exact photorealistic likeness of the reference photo — same eye color, eye shape, fur color, fur pattern, facial proportions, nose and markings. Face identical to reference. Only costume and background change, never the face or fur. Professional portrait photography, photorealistic, sharp focus on the face, shallow depth of field, 8k.",
 
  jedi: "Bust portrait, cropped at mid-chest, no legs or paws visible in frame. The animal from the reference image wearing flowing dark brown Jedi robes with a hood draped around the shoulders and dark leather Jedi gloves on the paws. The gloved paw grips a glowing blue lightsaber held upright — gloves fully covering any skin, part of the Jedi costume. Dramatic cool blue volumetric lighting from the lightsaber illuminating the face and robes. Blurred starfield and colorful galaxy nebula in the background. No bare human hands, no human skin visible. CRITICAL FACE: The animal's face is an exact photorealistic likeness of the reference photo — same eye color, eye shape, fur color, fur pattern, facial proportions, nose and markings. Face identical to reference. Only costume and background change, never the face or fur. Professional portrait photography, photorealistic, sharp focus on the face, shallow depth of field, 8k.",
 
  astronaut: "Bust portrait, cropped at mid-chest, no legs or paws visible in frame. The animal from the reference image wearing a white NASA-style space suit with the helmet visor open, natural animal face fully visible, the suit collar and chest visible. Mission patches on the suit shoulders. Dramatic lighting with Earth and stars visible through a spaceship window behind, blurred deep space and galaxy nebula in the background. CRITICAL FACE: The animal's face is an exact photorealistic likeness of the reference photo — same eye color, eye shape, fur color, fur pattern, facial proportions, nose and markings. Face identical to reference. Only costume and background change, never the face or fur. Professional portrait photography, photorealistic, sharp focus on the face, shallow depth of field, 8k.",
 
  zana: "Bust portrait, cropped at mid-chest, no legs or paws visible in frame. The animal from the reference image wearing a delicate iridescent fairy gown bodice with soft glowing translucent wings spread beautifully behind the shoulders, a small golden flower tiara on the head. Soft magical ethereal lighting with warm golden tones, blurred enchanted forest with bokeh firefly lights in the background. CRITICAL FACE: The animal's face is an exact photorealistic likeness of the reference photo — same eye color, eye shape, fur color, fur pattern, facial proportions, nose and markings. Face identical to reference. Only costume and background change, never the face or fur. Professional portrait photography, photorealistic, sharp focus on the face, shallow depth of field, 8k.",
 
  regina: "Bust portrait, cropped at mid-chest, no legs or paws visible in frame. The animal from the reference image wearing a magnificent diamond and sapphire crown and a royal blue gown with gold brocade embroidery at the bodice and neckline. Warm chandelier lighting, blurred grand royal palace interior with tall arched windows and velvet drapes in the background. CRITICAL FACE: The animal's face is an exact photorealistic likeness of the reference photo — same eye color, eye shape, fur color, fur pattern, facial proportions, nose and markings. Face identical to reference. Only costume and background change, never the face or fur. Professional portrait photography, photorealistic, sharp focus on the face, shallow depth of field, 8k.",
 
  printesa: "Bust portrait, cropped at mid-chest, no legs or paws visible in frame. The animal from the reference image wearing an elegant traditional Japanese kimono in soft pink silk with delicate hand-embroidered cherry blossom patterns at the collar and shoulders, a small ornate kanzashi hair accessory with gold and jade flowers. Soft warm studio portrait lighting, blurred traditional Japanese garden with cherry blossom trees in the background. CRITICAL FACE: The animal's face is an exact photorealistic likeness of the reference photo — same eye color, eye shape, fur color, fur pattern, facial proportions, nose and markings. Face identical to reference. Only costume and background change, never the face or fur. Professional portrait photography, photorealistic, sharp focus on the face, shallow depth of field, 8k.",
 
  vrajitoare: "Bust portrait, cropped at mid-chest, no legs or paws visible in frame. The animal from the reference image wearing a dramatic black pointed witch hat with moon and star details and flowing deep purple velvet robes with gold thread at the collar and shoulders. Soft mysterious moonlit lighting with cool purple tones, blurred enchanted forest with bokeh lights in the background. CRITICAL FACE: The animal's face is an exact photorealistic likeness of the reference photo — same eye color, eye shape, fur color, fur pattern, facial proportions, nose and markings. Face identical to reference. Only costume and background change, never the face or fur. Professional portrait photography, photorealistic, sharp focus on the face, shallow depth of field, 8k.",
 
  inger: "Bust portrait, cropped at mid-chest, no legs or paws visible in frame. The animal from the reference image with soft white feathered angel wings gently spread behind the shoulders, a delicate golden halo glowing above the head, wearing a simple flowing white silk cloth draped over the chest. Warm divine golden light radiating from behind, blurred heavenly clouds and soft golden sky in the background. CRITICAL FACE: The animal's face is an exact photorealistic likeness of the reference photo — same eye color, eye shape, fur color, fur pattern, facial proportions, nose and markings. Face identical to reference. Only costume and background change, never the face or fur. Professional portrait photography, photorealistic, sharp focus on the face, shallow depth of field, 8k.",
 
  oilpainting: "Bust portrait composition, head and chest, classic oil painting crop. The animal from the reference image depicted in a stunning classical oil painting style, rich deep colors, visible brushstrokes, thick impasto texture, warm golden tones, dramatic chiaroscuro lighting. Head and chest portrait only. Museum-quality fine art, dark moody background with subtle vignette, reminiscent of Old Masters portraiture. CRITICAL FACE: The animal's face is an exact photorealistic likeness of the reference photo — same eye color, eye shape, fur color, fur pattern, facial proportions, nose and markings. Face identical to reference. Only artistic style changes, never the face or fur. Professional fine art oil painting, sharp focus on the face, 8k."
};
 
// ══════════════════════════════════════════
//  REPLICATE MODEL VERSION
// ══════════════════════════════════════════
const REPLICATE_MODEL = "zsxkib/instant-id:a8ff89f2c89255dc26af7c3f5f5ad8a956e4cfc5d1f0283e76b4b009ffcf0e48";
 
// ══════════════════════════════════════════
//  ENDPOINT
// ══════════════════════════════════════════
app.post('/generate', rateLimit, async (req, res) => {
  try {
    const { style_id, image_base64, email, pet_name, special_request } = req.body;
 
    if (!style_id || !image_base64) {
      return res.status(400).json({ error: 'style_id și image_base64 sunt obligatorii' });
    }
 
    const prompt = PROMPTS[style_id];
    if (!prompt) {
      return res.status(400).json({ error: 'Stil necunoscut: ' + style_id });
    }
 
    const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
    if (!REPLICATE_API_KEY) {
      return res.status(500).json({ error: 'API key lipsă pe server' });
    }
 
    const replicateRes = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          input_images: [`data:image/jpeg;base64,${image_base64}`],
          aspect_ratio: "1:1",
          resolution: "1 MP",
          output_format: "png"
        }
      })
    });
 
    const prediction = await replicateRes.json();
 
    if (!prediction.id) {
      return res.status(500).json({ error: 'Eroare Replicate: ' + JSON.stringify(prediction) });
    }
 
    // Helper să extragem URL din output (string sau array)
    function extractUrl(output) {
      if (!output) return null;
      if (typeof output === 'string') return output;
      if (Array.isArray(output)) return output[0];
      return null;
    }
 
    // Dacă Prefer:wait a returnat direct rezultatul
    if (prediction.status === 'succeeded') {
      const result = extractUrl(prediction.output);
      console.log('Succedat direct:', result);
      return res.json({ image_url: result });
    }
 
    // Altfel polling
    let result = null;
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 3000));
 
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Bearer ${REPLICATE_API_KEY}` }
      });
      const pollData = await pollRes.json();
      console.log(`Poll ${i}: status=${pollData.status}, output=${JSON.stringify(pollData.output)}`);
 
      if (pollData.status === 'succeeded') {
        result = extractUrl(pollData.output);
        break;
      }
      if (pollData.status === 'failed') {
        return res.status(500).json({ error: 'Generare eșuată: ' + pollData.error });
      }
    }
 
    if (!result) {
      return res.status(500).json({ error: 'Timeout — încearcă din nou' });
    }
 
    console.log('Rezultat final:', result);
    res.json({ image_url: result });
 
  } catch (err) {
    console.error('Eroare server:', err);
    res.status(500).json({ error: 'Eroare internă: ' + err.message });
  }
});
 
app.get('/', (req, res) => res.json({ status: 'PawArt Proxy OK 🐾' }));
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PawArt Proxy rulează pe portul ${PORT}`));
