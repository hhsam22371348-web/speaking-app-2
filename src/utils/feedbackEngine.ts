import { FeedbackResult, Turn } from '../types';

export function evaluateSpeechDeterministically(
  turn: Turn,
  userTranscript: string,
  failureCount: number
): FeedbackResult {
  const trimmed = userTranscript.trim();

  // If no speech
  if (!trimmed) {
    return {
      isSuccess: false,
      noSpeech: true,
      feedbackEn: "That's okay! Tap the mic and try again.",
      feedbackKo: '괜찮아요! 마이크를 누르고 다시 말해 보세요.',
      recognizedText: '',
      isAiGenerated: false,
    };
  }

  // Clean and split words
  const cleanTranscript = trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const recognizedWords = cleanTranscript.split(/\s+/).filter(Boolean);

  // Helper to check if a keyword list is satisfied
  const checkKeyWords = (kws: string[]): boolean => {
    return kws.every((kw) => {
      const cleanKw = kw.toLowerCase().trim();
      return recognizedWords.some(
        (w) => w === cleanKw || w.includes(cleanKw) || cleanKw.includes(w)
      );
    });
  };

  // 1. Check primary target sentence
  const primaryMatches = checkKeyWords(turn.keyWords);

  // 2. Check all alternative expressions
  const matchedAlternative = turn.alternativeExpressions?.find((alt) =>
    checkKeyWords(alt.keyWords)
  );

  const isSuccess = primaryMatches || Boolean(matchedAlternative);

  if (isSuccess) {
    if (matchedAlternative && !primaryMatches) {
      return {
        isSuccess: true,
        noSpeech: false,
        feedbackEn: `Great job! That's a very natural expression (${matchedAlternative.label}).`,
        feedbackKo: `자연스럽고 좋은 표현이에요! 의도가 명확히 전달되었습니다.`,
        recognizedText: trimmed,
        isAiGenerated: false,
      };
    }

    // Check if small nonessential word was omitted in primary target
    const cleanTarget = turn.targetSentence.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const targetWords = cleanTarget.split(/\s+/).filter(Boolean);
    const smallWords = ['the', 'a', 'an', 'to', 'in', 'at', 'on', 'my', 'some', 'for'];
    const omittedSmallWord = targetWords.find(
      (tw) => smallWords.includes(tw) && !recognizedWords.includes(tw)
    );

    if (omittedSmallWord) {
      return {
        isSuccess: true,
        noSpeech: false,
        feedbackEn: `Nice work! I understood you, but try adding "${omittedSmallWord}" next time.`,
        feedbackKo: `잘 알아들었어요! 다음에는 ${omittedSmallWord}를 넣어 보세요.`,
        recognizedText: trimmed,
        isAiGenerated: false,
      };
    }

    return {
      isSuccess: true,
      noSpeech: false,
      feedbackEn: 'Great job! I understood what you wanted to say.',
      feedbackKo: '무슨 말을 하고 싶은지 잘 이해했어요!',
      recognizedText: trimmed,
      isAiGenerated: false,
    };
  }

  // Progressive failure stages
  if (failureCount === 0) {
    // 1st failure — Recast with target or suggestions
    return {
      isSuccess: false,
      noSpeech: false,
      feedbackEn: `Nice try! You can say, "${turn.targetSentence}"`,
      feedbackKo: '이렇게 말해 볼까요? (또는 힌트 버튼으로 다양한 표현을 확인해 보세요!)',
      recognizedText: trimmed,
      isAiGenerated: false,
    };
  } else if (failureCount === 1) {
    // 2nd failure — Elicitation with first-letter hint
    const missingWord = turn.keyWords[0] || 'word';
    const firstLetter = missingWord.charAt(0).toUpperCase();
    const hintWord = firstLetter + '_'.repeat(Math.max(1, missingWord.length - 1));
    const sentenceWithBlank = turn.targetSentence.replace(
      new RegExp(`\\b${missingWord}\\b`, 'i'),
      hintWord
    );

    return {
      isSuccess: false,
      noSpeech: false,
      feedbackEn: `Good effort! "${sentenceWithBlank}"`,
      feedbackKo: `핵심 단어는 ${firstLetter}로 시작해요!`,
      recognizedText: trimmed,
      isAiGenerated: false,
    };
  } else {
    // 3rd failure or more — Chunking
    const chunkStr = turn.chunks.length > 0 ? turn.chunks.join(' / ') : turn.targetSentence;
    return {
      isSuccess: false,
      noSpeech: false,
      feedbackEn: `Keep going! Try "${chunkStr}"`,
      feedbackKo: '짧게 나누어 말해 보세요!',
      recognizedText: trimmed,
      isAiGenerated: false,
    };
  }
}

export async function getFeedback(
  situationTitle: string,
  turn: Turn,
  userTranscript: string,
  failureCount: number
): Promise<FeedbackResult> {
  const trimmed = userTranscript.trim();
  if (!trimmed) {
    return evaluateSpeechDeterministically(turn, '', failureCount);
  }

  // Try server endpoint (which uses Gemini when available)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        situationTitle,
        partnerName: turn.partnerName,
        partnerRole: turn.partnerRole,
        targetSentence: turn.targetSentence,
        koreanMeaning: turn.koreanMeaning,
        keyWords: turn.keyWords,
        chunks: turn.chunks,
        alternativeExpressions: turn.alternativeExpressions,
        userTranscript: trimmed,
        failureCount,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (_e) {
    // Fetch failed or timed out, fallback gracefully
  }

  // Guaranteed fallback
  return evaluateSpeechDeterministically(turn, trimmed, failureCount);
}
