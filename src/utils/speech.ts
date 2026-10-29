/**
 * Speech synthesis (Text-to-Speech) and Speech recognition (STT) utilities.
 * Follows technical requirements with robust crash & lockup prevention:
 * - Fresh SpeechRecognition instance per session to avoid InvalidStateError
 * - Safety watchdog timer on SpeechSynthesis to prevent mic button lockup
 * - Supports instant abort/interruption so recording can start even if audio was playing
 */

export interface SpeechRecognitionSupport {
  isSupported: boolean;
  isInAppBrowser: boolean;
  reason?: string;
}

export function checkSpeechRecognitionSupport(): SpeechRecognitionSupport {
  if (typeof window === 'undefined') {
    return { isSupported: false, isInAppBrowser: false, reason: 'SSR environment' };
  }

  const userAgent = navigator.userAgent || '';
  const isInApp = /KAKAOTALK|Instagram|FBAN|FBAV|Line|Whale/i.test(userAgent);

  const SpeechRecognitionAPI =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) {
    return {
      isSupported: false,
      isInAppBrowser: isInApp,
      reason: isInApp
        ? 'In-app browser detected (e.g. KakaoTalk/Instagram). Please open this link in Google Chrome or Safari.'
        : 'Web Speech API is not supported in this browser. Please open in Google Chrome.',
    };
  }

  return {
    isSupported: true,
    isInAppBrowser: isInApp,
  };
}

let activeUtterance: SpeechSynthesisUtterance | null = null;
let speechSafetyTimer: any = null;

export function stopSpeaking(): void {
  if (speechSafetyTimer) {
    clearTimeout(speechSafetyTimer);
    speechSafetyTimer = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_e) {}
    activeUtterance = null;
  }
}

export function speakText(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): Promise<void> {
  return new Promise((resolve) => {
    stopSpeaking();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      options?.onEnd?.();
      resolve();
      return;
    }

    // Clean text of parenthetical notes if any
    const cleanText = text.replace(/\([^)]*\)/g, '').trim();
    if (!cleanText) {
      options?.onEnd?.();
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = options?.rate ?? 0.9;
    utterance.pitch = options?.pitch ?? 1.0;

    // Try finding an English voice
    try {
      const voices = window.speechSynthesis.getVoices();
      const englishVoice =
        voices.find((v) => v.lang.startsWith('en-US') && !v.name.includes('Bad')) ||
        voices.find((v) => v.lang.startsWith('en'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
    } catch (_e) {}

    let hasEnded = false;
    const finish = () => {
      if (hasEnded) return;
      hasEnded = true;
      if (speechSafetyTimer) {
        clearTimeout(speechSafetyTimer);
        speechSafetyTimer = null;
      }
      activeUtterance = null;
      options?.onEnd?.();
      resolve();
    };

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = finish;

    utterance.onerror = (e) => {
      options?.onError?.(e);
      finish();
    };

    activeUtterance = utterance;

    // Safety watchdog: Chrome synthesis can stall indefinitely without firing onend.
    // Ensure onEnd fires within expected duration + buffer.
    const expectedDurationMs = Math.max(3000, cleanText.length * 100);
    speechSafetyTimer = setTimeout(() => {
      finish();
    }, expectedDurationMs);

    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        options?.onError?.(err);
        finish();
      }
    }, 40);
  });
}

export class VoiceRecognitionController {
  private recognition: any = null;
  private silenceTimer: any = null;
  private isListeningState: boolean = false;
  private latestTranscript: string = '';

  public get isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public get isListening(): boolean {
    return this.isListeningState;
  }

  public startListening(callbacks: {
    onStart: () => void;
    onInterimResult: (transcript: string) => void;
    onFinalResult: (transcript: string) => void;
    onError: (errorType: string, message: string) => void;
    onEnd: () => void;
  }): void {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      callbacks.onError('not-supported', 'Speech recognition is not supported in this browser.');
      return;
    }

    // Stop and destroy previous recognition session cleanly
    this.stopListening();

    this.latestTranscript = '';
    this.clearSilenceTimer();

    try {
      // Re-create recognition instance each time to eliminate InvalidStateError in Chrome/Safari
      const rec = new SpeechRecognitionAPI();
      rec.lang = 'en-US';
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.continuous = false;

      let started = false;

      rec.onstart = () => {
        this.isListeningState = true;
        started = true;
        callbacks.onStart();
      };

      rec.onresult = (event: any) => {
        this.clearSilenceTimer();

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const text = (final || interim).trim();
        if (text) {
          this.latestTranscript = text;
          callbacks.onInterimResult(text);
        }

        // Reset ~1.5s silence timer once user pauses
        this.silenceTimer = setTimeout(() => {
          if (this.isListeningState && this.recognition) {
            try {
              this.recognition.stop();
            } catch (_e) {}
          }
        }, 1500);
      };

      rec.onerror = (event: any) => {
        this.clearSilenceTimer();
        const error = event.error;
        let msg = 'Could not recognize speech. Please try again.';
        if (error === 'not-allowed' || error === 'permission-denied') {
          msg = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
        } else if (error === 'no-speech') {
          msg = 'No speech detected.';
        }
        callbacks.onError(error, msg);
      };

      rec.onend = () => {
        this.clearSilenceTimer();
        this.isListeningState = false;
        callbacks.onFinalResult(this.latestTranscript);
        callbacks.onEnd();
      };

      this.recognition = rec;
      rec.start();
    } catch (err: any) {
      this.isListeningState = false;
      callbacks.onError('start-failed', err?.message || 'Failed to start speech recognition.');
    }
  }

  public stopListening(): void {
    this.clearSilenceTimer();
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (_e) {
        try {
          this.recognition.stop();
        } catch (_e2) {}
      }
      this.recognition = null;
    }
    this.isListeningState = false;
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }
}
