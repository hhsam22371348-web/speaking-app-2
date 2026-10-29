export type Screen = 'start' | 'practice' | 'result';

export interface Turn {
  id: number;
  partnerName: string;
  partnerRole: string;
  partnerAvatar: 'sofia' | 'amina' | 'alex' | 'jamie' | 'taylor';
  partnerText: string;
  partnerKorean: string;
  targetSentence: string;
  koreanMeaning: string;
  keyWords: string[];
  chunks: string[];
  alternativeExpressions: {
    text: string;
    label: string; // e.g. "Casual / 친근한 표현", "Polite / 정중한 표현", "Natural / 자연스러운 표현"
    keyWords: string[];
  }[];
}

export interface Situation {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  learningObjective: string;
  partnerSummary: string;
  partnerAvatars: ('sofia' | 'amina' | 'alex' | 'jamie' | 'taylor')[];
  scenarioDetails: string;
  tagColor: {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    accent: string;
  };
  turns: Turn[];
}

export interface TurnAttemptResult {
  turnId: number;
  targetSentence: string;
  koreanMeaning: string;
  recognizedText: string;
  isSuccess: boolean;
  isSkipped: boolean;
  attemptsCount: number;
}

export interface FeedbackResult {
  isSuccess: boolean;
  noSpeech?: boolean;
  feedbackEn: string;
  feedbackKo: string;
  recognizedText: string;
  isAiGenerated?: boolean;
}
