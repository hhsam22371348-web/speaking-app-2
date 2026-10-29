import { useState } from 'react';
import { Screen, Situation, TurnAttemptResult } from './types';
import { SITUATIONS } from './data/situations';
import { StartScreen } from './components/StartScreen';
import { PracticeScreen } from './components/PracticeScreen';
import { ResultScreen } from './components/ResultScreen';
import { GraduationCap } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('start');
  const [selectedSituation, setSelectedSituation] = useState<Situation>(SITUATIONS[0]);
  const [practiceResults, setPracticeResults] = useState<TurnAttemptResult[]>([]);

  // Navigation handlers
  const handleSelectSituation = (situation: Situation) => {
    setSelectedSituation(situation);
  };

  const handleStartPractice = () => {
    setCurrentScreen('practice');
  };

  const handleFinishPractice = (results: TurnAttemptResult[]) => {
    setPracticeResults(results);
    setCurrentScreen('result');
  };

  const handlePracticeAgain = () => {
    setCurrentScreen('practice');
  };

  const handleTryAnotherSituation = () => {
    setCurrentScreen('start');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Bar / Header */}
      <nav className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div
            onClick={handleTryAnotherSituation}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-2xs">
              CT
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-base tracking-tight">
                Campus Talk!
              </span>
              <span className="hidden sm:inline-block text-xs text-slate-400 ml-2 font-medium">
                Exchange Student Speaking
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentScreen !== 'start' && (
              <button
                type="button"
                onClick={handleTryAnotherSituation}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <span>← 상황 선택으로</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center">
        {currentScreen === 'start' && (
          <StartScreen
            situations={SITUATIONS}
            selectedSituation={selectedSituation}
            onSelectSituation={handleSelectSituation}
            onStartPractice={handleStartPractice}
          />
        )}

        {currentScreen === 'practice' && (
          <PracticeScreen
            situation={selectedSituation}
            onFinishSituation={handleFinishPractice}
            onReturnHome={handleTryAnotherSituation}
          />
        )}

        {currentScreen === 'result' && (
          <ResultScreen
            situation={selectedSituation}
            results={practiceResults}
            onPracticeAgain={handlePracticeAgain}
            onTryAnotherSituation={handleTryAnotherSituation}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">Campus Talk!</span>
            <span>— Speak English, Live Abroad</span>
          </div>

          <div className="flex items-center gap-3">
            <span>CEFR A2–B1 Speaking Practice</span>
            <span>·</span>
            <span>Voice processed in-browser, no audio saved</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
