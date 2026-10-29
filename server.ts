import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Curated high quality biblical Unsplash images pool
const BIBLICAL_IMAGE_POOL: Record<string, string> = {
  'လူပုဂ္ဂိုလ်များ': 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=800&auto=format&fit=crop&q=80',
  'နေရာဒေသများ': 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80',
  'ဝေါဟာရနှင့် သမ္မာတရားများ': 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&auto=format&fit=crop&q=80',
  'ဝတ်ပြုကိုးကွယ်မှု': 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
  'ပွဲတော်နှင့် အခမ်းအနား': 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80',
};

/**
 * Endpoint to generate a single biblical dictionary entry by user search keyword
 */
app.post('/api/ai/generate-entry', async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    const cleanKeyword = keyword.trim();

    const prompt = `သမ္မာကျမ်းစာ အဘိဓာန်အတွက် စကားလုံး သို့မဟုတ် ခေါင်းစဉ်ဖြစ်သော "${cleanKeyword}" အတွက် အပြည့်စုံဆုံးနှင့် အတိကျဆုံး သမ္မာကျမ်းစာ အဘိဓာန် ဆောင်းပါးကို ရေးသားပေးပါ။
ခေါင်းစဉ်သည် သမ္မာကျမ်းစာမြန်မာပြန် (Judson Bible) နှင့် ကိုက်ညီရပါမည်။

ဖွဲ့စည်းပုံ ပုံစံနမူနာ-
${cleanKeyword} ([Original English / Transliteration])
 * မူရင်း အင်္ဂလိပ်စကားလုံး: ...
 * ဟေဗြဲ မူရင်းစကားလုံး (ဓမ္မဟောင်း) သို့မဟုတ် ဂရိ မူရင်းစကားလုံး (ဓမ္မသစ်):
   * [အမည်] - [ဟေဗြဲ/ဂရိ စာလုံး] ([Romanization]) [Strong's: H... သို့မဟုတ် G...]
     * အဓိပ္ပာယ်: ...
 * အဓိပ္ပာယ်ရှင်းလင်းချက်:
   [အသေးစိတ် ဓမ္မအဓိပ္ပာယ် ရေးသားပါ]
 * ကျမ်းစာကိုးကား:
   * [ကျမ်းစာစောင် အခန်း:အခန်းငယ်] — "..."
 * ကျမ်းစာသုံး သဘောတရားနှင့် အကြောင်းအရာ (Context):
   [သမိုင်းကြောင်းနှင့် ဓမ္မသဘောတရား အနှစ်ချုပ်]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are a scholarly Myanmar Bible Dictionary lexicographer. Return a valid JSON object matching the schema with precise theological and Strong's Concordance information in standard Myanmar language.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Standard Myanmar title for the biblical entry (e.g. မေလခိဇေဒက်)'
            },
            category: {
              type: Type.STRING,
              description: 'Must be one of: လူပုဂ္ဂိုလ်များ, နေရာဒေသများ, ဝေါဟာရနှင့် သမ္မာတရားများ, ဝတ်ပြုကိုးကွယ်မှု, ပွဲတော်နှင့် အခမ်းအနား'
            },
            meaning: {
              type: Type.STRING,
              description: 'Full structured biblical article text with Strongs numbers, meaning, references, and context'
            }
          },
          required: ['title', 'category', 'meaning']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const cat = parsed.category || 'ဝေါဟာရနှင့် သမ္မာတရားများ';
    parsed.imageUrl = BIBLICAL_IMAGE_POOL[cat] || BIBLICAL_IMAGE_POOL['ဝေါဟာရနှင့် သမ္မာတရားများ'];

    return res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/ai/generate-entry:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate entry' });
  }
});

/**
 * Endpoint to generate a batch of fresh Bible dictionary words not yet in database
 */
app.post('/api/ai/batch-generate', async (req, res) => {
  try {
    const { count = 20, existingTitles = [] } = req.body;
    const requestedCount = Math.min(Math.max(Number(count) || 20, 1), 30);
    const existingListStr = Array.isArray(existingTitles) ? existingTitles.slice(0, 100).join(', ') : '';

    const prompt = `Generate exactly ${requestedCount} distinct, important Holy Bible dictionary words (names, places, theological terms, feasts, objects) in standard Myanmar language that are NOT in this existing list:
[${existingListStr}].

Every entry must have:
1. title: Myanmar title (e.g., မေလခိဇေဒက်, ဂါလိလဲ, ရှင်ပြန်ထမြောက်ရာနေ့, စာတန်, သန့်ရှင်းသောမုန့်, etc.)
2. category: one of 'လူပုဂ္ဂိုလ်များ', 'နေရာဒေသများ', 'ဝေါဟာရနှင့် သမ္မာတရားများ', 'ဝတ်ပြုကိုးကွယ်မှု', 'ပွဲတော်နှင့် အခမ်းအနား'
3. meaning: Complete, formatted entry with English name, Hebrew/Greek root word with Strong's Concordance code, detailed biblical definition, key scripture verse references, and theological context.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are an expert Bible theologian. Generate a JSON array of high quality Myanmar Bible dictionary entries. Do not repeat any existing entries.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              meaning: { type: Type.STRING }
            },
            required: ['title', 'category', 'meaning']
          }
        }
      }
    });

    const entries = JSON.parse(response.text || '[]');
    const results = entries.map((item: any) => ({
      ...item,
      imageUrl: BIBLICAL_IMAGE_POOL[item.category] || BIBLICAL_IMAGE_POOL['ဝေါဟာရနှင့် သမ္မာတရားများ']
    }));

    return res.json(results);
  } catch (err: any) {
    console.error('Error in /api/ai/batch-generate:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate batch' });
  }
});

// Full-Stack Dev vs Prod Serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
