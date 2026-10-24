import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../server/uploads/') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/vision', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: true,
        data: {
          title: '',
          description: '',
          category: '',
          color: '',
          brand: '',
          tags: [],
          message: 'Add GEMINI_API_KEY to .env for AI auto-fill'
        }
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const imageData = fs.readFileSync(req.file.path);
    const base64Image = imageData.toString('base64');
    
    const prompt = `Analyze this lost/found item image and extract details. 
    Return ONLY a valid JSON object with these fields:
    {
      "title": "short item name (e.g., Black Wallet, iPhone 13)",
      "description": "brief description of the item",
      "category": "one of: ID Card, Wallet, Electronics, Phone, Bottle, Calculator, Keys, Umbrella, Stationery, Bag, Eyewear, Documents, Jewelry, Clothing, Other",
      "color": "primary color",
      "brand": "brand name if visible, else empty string",
      "tags": ["relevant", "tags"]
    }
    Be accurate and concise.`;
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: req.file.mimetype
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const data = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      
      fs.unlinkSync(req.file.path);
      
      res.json({ success: true, data });
    } catch (parseError) {
      fs.unlinkSync(req.file.path);
      res.json({
        success: true,
        data: {
          title: '',
          description: text.substring(0, 200),
          category: '',
          color: '',
          brand: '',
          tags: []
        }
      });
    }
  } catch (error) {
    console.error('AI Vision error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

router.post('/autofill', async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ success: true, data: {} });
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Based on this description of a lost/found item, suggest missing details.
    Description: "${description}"
    Return ONLY valid JSON:
    {
      "title": "suggested title",
      "category": "best matching category",
      "color": "color",
      "brand": "brand or empty"
    }`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('AI autofill error:', error);
    res.status(500).json({ error: 'AI autofill failed' });
  }
});

export default router;
