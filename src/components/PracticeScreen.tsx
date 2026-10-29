import React, { useState, useEffect, useRef } from 'react';
import { Situation, Turn, TurnAttemptResult, FeedbackResult } from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { speakText, stopSpeaking, VoiceRecognitionController, checkSpeechRecognitionSupport } from '../utils/speech';
import { getFeedback } from '../utils/feedbackEngine';
import {
  Volume2,
  Turtle,
  Mic,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  CheckCircle,
  AlertCircle,
  Home,
  Keyboard,
  Lightbulb,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface PracticeScreenProps {
  situation: Situation;
  onFinishSituation: (results: TurnAttemptResult[]) => void;
  onReturnHome: () => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  situation,
  onFinishSituation,
  onReturnHome,
}) => {
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [turnResults, setTurnResults] = useState<TurnAttemptResult[]>([]);
  const [failureCount, setFailureCount] = useState(0);

  // Hint visibility state (initially hidden as requested by user)
  const [showHint, setShowHint] = useState(false);
  const [selectedAlternativeIndex, setSelectedAlternativeIndex] = useState<number | null>(null);

  // Audio / Mic states
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioLabel, setAudioLabel] = useState<string | null>(null);
  const [micState, setMicState] = useState<'ready' | 'listening' | 'done'>('ready');
  const [recognizedTranscript, setRecognizedTranscript] = useState('');
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Fallback text input modal / helper for testing or when mic is denied
  const [showTextInput, setShowTextInput] = useState(false);
  const [customInputText, setCustomInputText] = useState('');
  const [browserWarning, setBrowserWarning] = useState<string | null>(null);

  const voiceControllerRef = useRef<VoiceRecognitionController | null>(null);
  const currentTurn: Turn = situation.turns[currentTurnIndex];

  // Initialize SpeechRecognition controller and check support
  useEffect(() => {
    voiceControllerRef.current = new VoiceRecognitionController();
    const support = checkSpeechRecognitionSupport();
    if (!support.isSupported) {
      setBrowserWarning(support.reason || 'Speech recognition not supported in this browser.');
    }

    return () => {
      stopSpeaking();
      voiceControllerRef.current?.stopListening();
    };
  }, []);

  // When turn changes: reset states, keep hints hidden initially, and play partner line
  useEffect(() => {
    setFailureCount(0);
    setRecognizedTranscript('');
    setFeedback(null);
    setMicState('ready');
    setShowHint(false); // Initially hidden!
    setSelectedAlternativeIndex(null);
    setShowTextInput(false);
    setCustomInputText('');

    // Ensure audio and voice recognition are clean
    stopSpeaking();
    if (voiceControllerRef.current) {
      voiceControllerRef.current.stopListening();
    }

    // Play partner line once with short initial delay
    const timer = setTimeout(() => {
      playPartnerLine();
    }, 300);

    return () => {
      clearTimeout(timer);
      stopSpeaking();
      if (voiceControllerRef.current) {
        voiceControllerRef.current.stopListening();
      }
    };
  }, [currentTurnIndex]);

  // Read partner's dialogue
  const playPartnerLine = () => {
    stopSpeaking();
    setIsPlayingAudio(true);
    setAudioLabel("Partner Speaking");

    speakText(currentTurn.partnerText, {
      rate: 0.9,
      onEnd: () => {
        setIsPlayingAudio(false);
        setAudioLabel(null);
      },
      onError: () => {
        setIsPlayingAudio(false);
        setAudioLabel(null);
      },
    });
  };

  // Play target sentence or alternative sentence
  const handlePlaySentence = (text: string, rate: number = 0.9, label: string = 'Target') => {
    stopSpeaking();
    setIsPlayingAudio(true);
    setAudioLabel(label);

    speakText(text, {
      rate,
      onEnd: () => {
        setIsPlayingAudio(false);
        setAudioLabel(null);
      },
      onError: () => {
        setIsPlayingAudio(false);
        setAudioLabel(null);
      },
    });
  };

  // Process and evaluate transcript
  const processSpeech = async (spokenText: string) => {
    setIsEvaluating(true);
    setRecognizedTranscript(spokenText);

    try {
      const result = await getFeedback(
        situation.title,
        currentTurn,
        spokenText,
        failureCount
      );

      setFeedback(result);

      if (result.isSuccess) {
        setMicState('done');
      } else if (result.noSpeech) {
        setMicState('ready');
        // Do NOT increment failure count for silence
      } else {
        setMicState('ready');
        setFailureCount((prev) => prev + 1);
        // Automatically open hint on failure so student gets supportive guidance!
        setShowHint(true);
      }
    } catch (_err) {
      setMicState('ready');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Mic Button Click handler
  const handleMicClick = () => {
    if (isEvaluating) return;

    // If audio is currently playing, clicking the mic immediately stops audio so user can record!
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
      setAudioLabel(null);
    }

    if (micState === 'listening') {
      voiceControllerRef.current?.stopListening();
      return;
    }

    if (!voiceControllerRef.current?.isSupported) {
      setBrowserWarning('Microphone recognition is not supported in this browser. Please use Chrome or type your phrase below.');
      setShowTextInput(true);
      return;
    }

    voiceControllerRef.current.startListening({
      onStart: () => {
        setMicState('listening');
        setRecognizedTranscript('');
      },
      onInterimResult: (interim) => {
        setRecognizedTranscript(interim);
      },
      onFinalResult: (final) => {
        if (final.trim()) {
          processSpeech(final);
        } else {
          processSpeech('');
        }
      },
      onError: (errType, msg) => {
        setMicState('ready');
        if (errType === 'not-allowed') {
          setBrowserWarning(msg);
        } else if (errType !== 'no-speech') {
          setBrowserWarning(msg);
        } else {
          processSpeech('');
        }
      },
      onEnd: () => {
        setMicState((prev) => (prev === 'listening' ? 'ready' : prev));
      },
    });
  };

  // Reset mic controller manually if browser context glitches
  const handleResetMic = () => {
    stopSpeaking();
    setIsPlayingAudio(false);
    setAudioLabel(null);
    if (voiceControllerRef.current) {
      voiceControllerRef.current.stopListening();
    }
    setMicState('ready');
  };

  // Try again
  const handleTryAgain = () => {
    stopSpeaking();
    setMicState('ready');
    setRecognizedTranscript('');
    setFeedback(null);
  };

  // Previous Turn / Back
  const handlePrevTurn = () => {
    stopSpeaking();
    if (voiceControllerRef.current) {
      voiceControllerRef.current.stopListening();
    }

    if (currentTurnIndex > 0) {
      setTurnResults((prev) => prev.slice(0, currentTurnIndex - 1));
      setCurrentTurnIndex((prev) => prev - 1);
    } else {
      onReturnHome();
    }
  };

  // Next Turn
  const handleNextTurn = () => {
    stopSpeaking();
    if (voiceControllerRef.current) {
      voiceControllerRef.current.stopListening();
    }

    const isCompleted = feedback?.isSuccess || false;
    const currentResult: TurnAttemptResult = {
      turnId: currentTurn.id,
      targetSentence: currentTurn.targetSentence,
      koreanMeaning: currentTurn.koreanMeaning,
      recognizedText: recognizedTranscript,
      isSuccess: isCompleted,
      isSkipped: false,
      attemptsCount: failureCount + 1,
    };

    const nextResults = [...turnResults, currentResult];
    setTurnResults(nextResults);

    if (currentTurnIndex + 1 < situation.turns.length) {
      setCurrentTurnIndex((prev) => prev + 1);
    } else {
      onFinishSituation(nextResults);
    }
  };

  // Skip Turn
  const handleSkipTurn = () => {
    stopSpeaking();
    if (voiceControllerRef.current) {
      voiceControllerRef.current.stopListening();
    }

    const skipResult: TurnAttemptResult = {
      turnId: currentTurn.id,
      targetSentence: currentTurn.targetSentence,
      koreanMeaning: currentTurn.koreanMeaning,
      recognizedText: recognizedTranscript || '(Skipped)',
      isSuccess: false,
      isSkipped: true,
      attemptsCount: failureCount,
    };

    const nextResults = [...turnResults, skipResult];
    setTurnResults(nextResults);

    if (currentTurnIndex + 1 < situation.turns.length) {
      setCurrentTurnIndex((prev) => prev + 1);
    } else {
      onFinishSituation(nextResults);
    }
  };

  const isSuccess = feedback?.isSuccess || false;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4 md:py-6 flex flex-col items-center">
      {/* Navigation Header */}
      <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevTurn}
            className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200 shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>뒤로 가기</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              onReturnHome();
            }}
            title="상황 목록 홈으로"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">
            {situation.emoji} {situation.title}
          </span>
        </div>

        {/* Turn Indicator */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
            Turn {currentTurnIndex + 1} of {situation.turns.length}
          </span>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="w-full flex items-center gap-1.5 mb-5">
        {situation.turns.map((t, idx) => {
          const isDone = idx < currentTurnIndex;
          const isCurrent = idx === currentTurnIndex;
          return (
            <div
              key={t.id}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                isDone
                  ? 'bg-emerald-500'
                  : isCurrent
                  ? 'bg-indigo-600 ring-2 ring-indigo-200'
                  : 'bg-slate-200'
              }`}
            />
          );
        })}
      </div>

      {/* Browser Warning Banner */}
      {browserWarning && (
        <div className="w-full mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{browserWarning}</p>
            <p className="mt-0.5 text-amber-800">
              마이크가 지원되지 않거나 차단된 경우 아래 &quot;직접 입력해서 테스트&quot;를 눌러 말해볼 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {/* Screen 2 Top: Partner Dialogue */}
      <section className="w-full bg-white rounded-2xl border border-slate-200 p-4 md:p-5 mb-5 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="shrink-0 flex flex-col items-center">
            <CharacterAvatar name={currentTurn.partnerAvatar} size="md" />
            <span className="text-[11px] font-bold text-slate-700 mt-1">
              {currentTurn.partnerName}
            </span>
          </div>

          <div className="flex-1">
            <div className="relative bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-xs p-3.5 text-slate-800">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-500">
                  {currentTurn.partnerRole}
                </span>

                <button
                  type="button"
                  onClick={playPartnerLine}
                  title="Listen to partner line again"
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    audioLabel === 'Partner Speaking'
                      ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300 animate-pulse'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-200/60'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>다시 듣기</span>
                </button>
              </div>

              {/* Partner text */}
              <p className="text-base md:text-lg font-bold text-slate-900 leading-snug">
                &ldquo;{currentTurn.partnerText}&rdquo;
              </p>

              {/* Korean Translation */}
              <p className="text-xs md:text-sm text-slate-500 mt-1.5 font-medium">
                {currentTurn.partnerKorean}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Screen 2 Middle: Mission Goal & Interactive Hints */}
      <section className="w-full bg-gradient-to-b from-indigo-50/70 to-white rounded-2xl border-2 border-indigo-100 p-5 md:p-6 mb-5 shadow-sm text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">
          <span>Your Speaking Goal</span>
          <span className="text-indigo-300">·</span>
          <span>전달해야 할 뜻</span>
        </div>

        {/* Primary Korean Meaning displayed prominently first */}
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight my-2">
          &ldquo;{currentTurn.koreanMeaning}&rdquo;
        </h2>

        <p className="text-xs md:text-sm text-slate-600 font-medium mb-4">
          영어로 어떻게 말할 수 있을까요? 정답은 하나가 아니에요! 생각나는 대로 마이크를 켜고 말해보세요.
        </p>

        {/* Hint Toggle Button */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className={`px-4 py-2 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              showHint
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300'
            }`}
          >
            {showHint ? <EyeOff className="w-4 h-4" /> : <Lightbulb className="w-4 h-4 text-amber-500" />}
            <span>{showHint ? '힌트 및 예시 문장 접기' : '💡 힌트 & 다양한 표현 보기'}</span>
          </button>
        </div>

        {/* When Hints are REVEALED: Key words & Multiple Diverse Expressions */}
        {showHint ? (
          <div className="w-full bg-white/90 border border-amber-200 rounded-2xl p-4 md:p-5 text-left shadow-2xs animate-fadeIn">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  다양한 표현 연습 (답이 하나로 한정되지 않아요)
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                원하는 표현을 골라 말해보세요!
              </span>
            </div>

            {/* Keyword hint banner */}
            <div className="mb-3.5 p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/70 flex items-center gap-2">
              <span className="text-xs font-bold text-amber-900 shrink-0">핵심 키워드 힌트:</span>
              <div className="flex flex-wrap gap-1.5">
                {currentTurn.keyWords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-amber-200/90 text-amber-950 font-bold text-xs"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* List of Multiple Natural Expressions */}
            <div className="space-y-2.5">
              {currentTurn.alternativeExpressions?.map((alt, idx) => {
                const isSelected = selectedAlternativeIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-100'
                        : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                            {alt.label}
                          </span>
                        </div>
                        <p className="text-sm md:text-base font-bold text-slate-900">
                          {alt.text}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pt-1">
                        {/* Listen normal */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAlternativeIndex(idx);
                            handlePlaySentence(alt.text, 0.9, `Alt ${idx + 1}`);
                          }}
                          title="듣기 (Listen)"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>

                        {/* Listen slow */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAlternativeIndex(idx);
                            handlePlaySentence(alt.text, 0.7, `Alt ${idx + 1} (Slow)`);
                          }}
                          title="천천히 듣기 (Slow)"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <Turtle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* When Hints are HIDDEN: Clean encouragement card */
          <div className="p-4 bg-white/70 border border-slate-200/80 rounded-2xl text-center text-slate-500 text-xs">
            <p className="font-semibold text-slate-700 mb-1">
              먼저 자유롭게 영어로 소리 내어 말해보세요!
            </p>
            <p>
              막히거나 다른 표현들이 궁금하면 위의 <strong>[💡 힌트 &amp; 다양한 표현 보기]</strong> 버튼을 누르시면 됩니다.
            </p>
          </div>
        )}
      </section>

      {/* Screen 2 Bottom: Mic button & Recognized speech & Feedback */}
      <section className="w-full bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col items-center">
        {/* Status notice when partner audio is playing */}
        {isPlayingAudio && (
          <div className="w-full max-w-md mb-3 py-1.5 px-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold text-center animate-pulse flex items-center justify-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" />
            <span>{audioLabel || '음성 재생 중...'} (마이크를 누르면 즉시 멈추고 녹음됩니다)</span>
          </div>
        )}

        {/* Large Circular Mic Button */}
        <div className="flex flex-col items-center mb-4">
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isEvaluating}
            className={`w-20 h-20 md:w-22 md:h-22 rounded-full flex flex-col items-center justify-center transition-all duration-200 cursor-pointer shadow-md select-none ${
              micState === 'listening'
                ? 'bg-blue-600 text-white ring-8 ring-blue-100 animate-pulse scale-105'
                : micState === 'done'
                ? 'bg-emerald-600 text-white ring-8 ring-emerald-100'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-103'
            }`}
          >
            {micState === 'done' ? (
              <CheckCircle className="w-9 h-9" />
            ) : micState === 'listening' ? (
              <Mic className="w-8 h-8 animate-bounce" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>

          {/* Mic Label */}
          <span className="text-xs md:text-sm font-bold text-slate-800 mt-2.5">
            {micState === 'listening'
              ? '듣고 있어요... 말씀하세요! (Listening...)'
              : micState === 'done'
              ? '완료! 성공했습니다 (Done!)'
              : '마이크를 탭하고 말하기 (Tap to Speak)'}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            {micState === 'listening'
              ? '말씀 후 약 1.5초간 침묵하면 자동으로 인식됩니다.'
              : '준비되셨을 때 마이크를 누르고 편하게 말씀하세요.'}
          </span>
        </div>

        {/* Text Input / Quick Simulators for testing without mic */}
        <div className="w-full flex items-center justify-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => setShowTextInput(!showTextInput)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 underline underline-offset-2 cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{showTextInput ? '입력창 닫기' : '마이크 사용 불가 시 텍스트로 테스트하기'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetMic}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
            title="마이크 상태 리셋"
          >
            <RefreshCw className="w-3 h-3" />
            <span>마이크 리셋</span>
          </button>
        </div>

        {showTextInput && (
          <div className="w-full max-w-lg p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-left">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              말하고자 하는 영어 문장을 직접 입력해 보세요:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customInputText}
                onChange={(e) => setCustomInputText(e.target.value)}
                placeholder={currentTurn.targetSentence}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (customInputText.trim()) {
                    processSpeech(customInputText);
                  }
                }}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 cursor-pointer"
              >
                제출
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => processSpeech(currentTurn.targetSentence)}
                className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-medium hover:bg-emerald-200 cursor-pointer"
              >
                기본 예시문 테스트
              </button>
              {currentTurn.alternativeExpressions?.slice(1, 3).map((alt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => processSpeech(alt.text)}
                  className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-medium hover:bg-blue-200 cursor-pointer"
                >
                  대체 표현 {i + 1} 테스트
                </button>
              ))}
            </div>
          </div>
        )}

        {/* What was recognized */}
        {recognizedTranscript && (
          <div className="w-full max-w-lg mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              인식된 음성 (You Said)
            </span>
            <p className="text-sm md:text-base font-bold text-slate-900 mt-0.5">
              &ldquo;{recognizedTranscript}&rdquo;
            </p>
          </div>
        )}

        {/* Feedback Box showing character response */}
        {feedback && (
          <div
            className={`w-full max-w-xl p-4 rounded-xl border transition-all duration-200 mb-5 ${
              isSuccess
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : feedback.noSpeech
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <CharacterAvatar name={currentTurn.partnerAvatar} size="sm" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold">
                    {currentTurn.partnerName}&apos;s Feedback:
                  </span>
                  {feedback.isAiGenerated && (
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                      AI Coach
                    </span>
                  )}
                </div>

                <p className="text-sm md:text-base font-bold leading-snug">
                  {feedback.feedbackEn}
                </p>
                <p className="text-xs md:text-sm font-medium opacity-85 mt-1">
                  {feedback.feedbackKo}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions: [이전 문장], [Try Again], [Skip], [Next →] */}
        <div className="w-full max-w-lg flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevTurn}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs md:text-sm flex items-center gap-1 transition-colors cursor-pointer"
              title={currentTurnIndex > 0 ? "이전 문장으로 돌아가기" : "상황 목록으로 돌아가기"}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{currentTurnIndex > 0 ? "이전 문장" : "상황 목록"}</span>
            </button>

            <button
              type="button"
              onClick={handleTryAgain}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 font-bold text-xs md:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>다시 말하기</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSkipTurn}
              className="px-3.5 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-semibold text-xs md:text-sm flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Skip (건너뛰기)</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleNextTurn}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                isSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <span>Next Turn (다음 문장)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
