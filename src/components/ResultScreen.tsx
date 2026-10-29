import React from 'react';
import { Situation, TurnAttemptResult } from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { Star, RotateCcw, Compass, Home, CheckCircle2, SkipForward, Sparkles, ArrowLeft } from 'lucide-react';

interface ResultScreenProps {
  situation: Situation;
  results: TurnAttemptResult[];
  onPracticeAgain: () => void;
  onTryAnotherSituation: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  situation,
  results,
  onPracticeAgain,
  onTryAnotherSituation,
}) => {
  // Star calculation according to PRD Section 6:
  // ⭐⭐⭐ Complete all five turns without skipping.
  // ⭐⭐ Finish the whole dialogue with one or two skipped sentences.
  // ⭐ Finish the whole dialogue with three or more skipped sentences.
  const skippedCount = results.filter((r) => r.isSkipped).length;
  const completedCount = results.filter((r) => !r.isSkipped && r.isSuccess).length;

  let starRating = 3;
  let starMessage = 'Outstanding! You completed all 5 dialogue turns!';
  if (skippedCount >= 3) {
    starRating = 1;
    starMessage = 'Great effort! Stepping up to practice is the most important step.';
  } else if (skippedCount >= 1) {
    starRating = 2;
    starMessage = 'Well done! You participated actively and got through the scenario.';
  }

  // Representative character
  const mainAvatar = situation.partnerAvatars[0];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4 md:py-6 flex flex-col items-center">
      {/* Top Back Navigation Bar */}
      <div className="w-full flex items-center justify-between pb-3 mb-5 border-b border-slate-200">
        <button
          type="button"
          onClick={onTryAnotherSituation}
          className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>상황 목록으로 돌아가기</span>
        </button>

        <span className="text-xs font-bold text-slate-500">
          연습 결과 리포트
        </span>
      </div>

      {/* Top Section: Celebration & Stars */}
      <header className="text-center w-full max-w-xl mb-8 flex flex-col items-center">
        <div className="relative mb-3">
          <CharacterAvatar name={mainAvatar} size="xl" showBadge />
          <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-amber-400 text-white shadow-md animate-bounce">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          You Spoke Up!
        </h1>
        <p className="text-sm md:text-base text-slate-600 font-medium max-w-md">
          {starMessage}
        </p>

        {/* Completion Stars (1-3 stars) */}
        <div className="flex items-center gap-2 mt-4 mb-2">
          {[1, 2, 3].map((starIdx) => {
            const isFilled = starIdx <= starRating;
            return (
              <div
                key={starIdx}
                className={`p-2 rounded-2xl transition-all duration-300 ${
                  isFilled
                    ? 'bg-amber-100 text-amber-500 scale-110 shadow-sm'
                    : 'bg-slate-100 text-slate-300'
                }`}
              >
                <Star
                  className={`w-8 h-8 ${isFilled ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`}
                />
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-400 font-medium">
          Completion rating: {starRating} of 3 Stars (Rewarding participation &amp; completion)
        </p>
      </header>

      {/* Middle Section: Summary of Practiced Sentences */}
      <section className="w-full bg-white rounded-2xl border border-slate-200 p-5 md:p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Dialogue Summary
            </span>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              {situation.emoji} {situation.title}
            </h2>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500">Completed</span>
            <p className="text-sm font-bold text-slate-800">
              {completedCount} spoken · {skippedCount} skipped
            </p>
          </div>
        </div>

        {/* Sentences List */}
        <div className="space-y-3">
          {situation.turns.map((turn, idx) => {
            const result = results.find((r) => r.turnId === turn.id);
            const isCompleted = result && !result.isSkipped;
            const isSkipped = result && result.isSkipped;

            return (
              <div
                key={turn.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : isSkipped
                    ? 'bg-slate-50 border-slate-200 opacity-80'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 shrink-0 mt-0.5">
                      #{idx + 1}
                    </span>

                    <div className="flex-1">
                      <p className="text-sm md:text-base font-bold text-slate-900 leading-snug">
                        {turn.targetSentence}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {turn.koreanMeaning}
                      </p>

                      {result?.recognizedText && result.recognizedText !== '(Skipped)' && (
                        <p className="text-xs text-emerald-800 font-semibold mt-1">
                          You said: &ldquo;{result.recognizedText}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-200/80 px-2 py-1 rounded-full">
                        <SkipForward className="w-3.5 h-3.5" />
                        <span>Skipped</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Encouraging message */}
        <div className="mt-5 p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
          <p className="text-sm font-bold text-indigo-900">
            &ldquo;Every conversation makes you more confident!&rdquo;
          </p>
          <p className="text-xs text-indigo-700 mt-0.5 font-medium">
            (매번의 대화가 당신을 더욱 자신감 있게 만들어 줍니다!)
          </p>
        </div>
      </section>

      {/* Bottom Actions: Practice Again / Try Another Situation / Home */}
      <footer className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onPracticeAgain}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Practice Again (다시 연습하기)</span>
        </button>

        <button
          type="button"
          onClick={onTryAnotherSituation}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-sm shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <Compass className="w-4 h-4 text-indigo-600" />
          <span>Try Another Situation (다른 상황 선택)</span>
        </button>

        <button
          type="button"
          onClick={onTryAnotherSituation}
          className="w-full sm:w-auto px-4 py-3 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>
      </footer>
    </div>
  );
};
