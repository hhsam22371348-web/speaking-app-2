import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Gemini API instance (only initialized if GEMINI_API_KEY is available)
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

interface FeedbackRequestBody {
  situationTitle: string;
  partnerName: string;
  partnerRole: string;
  targetSentence: string;
  koreanMeaning: string;
  keyWords: string[];
  chunks: string[];
  alternativeExpressions?: {
    label: string;
    text: string;
    keyWords: string[];
  }[];
  userTranscript: string;
  failureCount: number; // 0 for first speech check, 1 if already failed once, etc.
}

app.post('/api/feedback', async (req: Request<{}, {}, FeedbackRequestBody>, res: Response) => {
  const {
    partnerName,
    partnerRole,
    targetSentence,
    koreanMeaning,
    keyWords = [],
    chunks = [],
    alternativeExpressions = [],
    userTranscript = '',
    failureCount = 0,
  } = req.body;

  const trimmedTranscript = (userTranscript || '').trim();

  // If no speech recognized
  if (!trimmedTranscript) {
    return res.json({
      isSuccess: false,
      noSpeech: true,
      feedbackEn: "That's okay! Tap the mic and try again.",
      feedbackKo: "괜찮아요! 마이크를 누르고 다시 말해 보세요.",
      recognizedText: '',
      isAiGenerated: false,
    });
  }

  // Normalize texts for key word checking
  const cleanText = trimmedTranscript.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const recognizedWords = cleanText.split(/\s+/).filter(Boolean);

  const missingKeyWords = keyWords.filter((kw) => {
    const cleanKw = kw.toLowerCase().trim();
    return !recognizedWords.some((w) => w === cleanKw || w.includes(cleanKw) || cleanKw.includes(w));
  });

  const checkWords = (kwList: string[]) => {
    return kwList.every((kw) => {
      const cleanKw = kw.toLowerCase().trim();
      return recognizedWords.some((w) => w === cleanKw || w.includes(cleanKw) || cleanKw.includes(w));
    });
  };

  const primaryMatches = checkWords(keyWords);
  const matchedAlt = alternativeExpressions.find((alt) => checkWords(alt.keyWords));
  const isSuccess = primaryMatches || Boolean(matchedAlt);

  // If Gemini is available, we can consult it for a supportive companion response
  if (aiClient) {
    try {
      const altListStr = alternativeExpressions.map((a) => `- [${a.label}] "${a.text}"`).join('\n');
      const prompt = `
You are the supportive speaking companion inside "Campus Talk!", an English practice app for exchange students.
The partner is ${partnerName} (${partnerRole}).
The communicative goal in Korean: "${koreanMeaning}"
Primary target sentence: "${targetSentence}"
Acceptable natural alternative expressions:
${altListStr}

The student said: "${trimmedTranscript}"
Previous failure count for this turn: ${failureCount}

CRITICAL RULES:
1. DO NOT RESTRICT THE STUDENT TO ONLY ONE EXACT PHRASE. Accept ANY natural, understandable English expression that successfully communicates the intended communicative goal ("${koreanMeaning}").
2. Focus on intelligibility and communication over native-like grammar or pronunciation.
3. If the student successfully communicated the meaning (matching primary, any alternative, or another clear, natural phrasing):
   - isSuccess = true
   - feedbackEn = "Great job! I understood what you wanted to say." or "Nice work! That's a great way to say it!"
   - feedbackKo = "무슨 말을 하고 싶은지 잘 이해했어요!"
4. If what they said is missing the core message or incomprehensible:
   - isSuccess = false
   - If failureCount === 0: Recast ("Nice try! You can say, \\"${targetSentence}\\" (이렇게 말해 볼까요?)")
   - If failureCount === 1: Elicitation hint with first letter ("Good effort! '...' (빠진 단어는 ...로 시작해요!)")
   - If failureCount >= 2: Chunking ("Keep going! Try ${chunks.join(' / ')} (짧게 나누어 말해 보세요!)")
5. Keep English feedback to 1-2 short sentences with Korean explanation. Never use "wrong", percentages, or scores.

Output strictly valid JSON with no markdown wrapping:
{
  "isSuccess": boolean,
  "feedbackEn": string,
  "feedbackKo": string
}
`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text?.trim();
      if (responseText) {
        const parsed = JSON.parse(responseText);
        return res.json({
          isSuccess: Boolean(parsed.isSuccess),
          noSpeech: false,
          feedbackEn: parsed.feedbackEn,
          feedbackKo: parsed.feedbackKo,
          recognizedText: trimmedTranscript,
          isAiGenerated: true,
        });
      }
    } catch (err) {
      console.warn('Gemini evaluation failed, falling back to rule engine:', err);
      // Fall through to deterministic rules
    }
  }

  // Deterministic rule engine (Section 7 PRD exact specification)
  if (isSuccess) {
    // Check if a small common word is omitted
    const cleanTarget = targetSentence.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const targetWords = cleanTarget.split(/\s+/).filter(Boolean);
    const smallOmittedWords = targetWords.filter(
      (tw) => ['the', 'a', 'an', 'to', 'in', 'at', 'on', 'some'].includes(tw) && !recognizedWords.includes(tw)
    );

    if (smallOmittedWords.length > 0) {
      const omitted = smallOmittedWords[0];
      return res.json({
        isSuccess: true,
        noSpeech: false,
        feedbackEn: `Nice work! I understood you, but try adding "${omitted}" next time.`,
        feedbackKo: `잘 알아들었어요! 다음에는 ${omitted}를 넣어 보세요.`,
        recognizedText: trimmedTranscript,
        isAiGenerated: false,
      });
    }

    return res.json({
      isSuccess: true,
      noSpeech: false,
      feedbackEn: 'Great job! I understood what you wanted to say.',
      feedbackKo: '무슨 말을 하고 싶은지 잘 이해했어요!',
      recognizedText: trimmedTranscript,
      isAiGenerated: false,
    });
  }

  // Failed attempts progression
  if (failureCount === 0) {
    // 1st failure — Recast
    return res.json({
      isSuccess: false,
      noSpeech: false,
      feedbackEn: `Nice try! You can say, "${targetSentence}"`,
      feedbackKo: '이렇게 말해 볼까요?',
      recognizedText: trimmedTranscript,
      isAiGenerated: false,
    });
  } else if (failureCount === 1) {
    // 2nd failure — Elicitation
    const firstMissing = missingKeyWords[0] || keyWords[0] || 'word';
    const firstLetter = firstMissing.charAt(0).toUpperCase();
    const hintWord = firstLetter + '_'.repeat(Math.max(1, firstMissing.length - 1));
    const sentenceWithBlank = targetSentence.replace(new RegExp(`\\b${firstMissing}\\b`, 'i'), hintWord);

    return res.json({
      isSuccess: false,
      noSpeech: false,
      feedbackEn: `Good effort! "${sentenceWithBlank}"`,
      feedbackKo: `빠진 단어는 ${firstLetter}로 시작해요!`,
      recognizedText: trimmedTranscript,
      isAiGenerated: false,
    });
  } else {
    // 3rd failure or more — Chunking
    const chunkStr = chunks.length > 0 ? chunks.join(' / ') : targetSentence;
    return res.json({
      isSuccess: false,
      noSpeech: false,
      feedbackEn: `Keep going! Try "${chunkStr}"`,
      feedbackKo: '짧게 나누어 말해 보세요!',
      recognizedText: trimmedTranscript,
      isAiGenerated: false,
    });
  }
});

// Setup Vite in middleware mode for dev, or static files for prod
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
