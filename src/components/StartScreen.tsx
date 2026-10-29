import React from 'react';
import { Situation } from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { Sparkles, ArrowRight, ShieldCheck, Compass, MessageCircleHeart, Users, CheckCircle2 } from 'lucide-react';

interface StartScreenProps {
  situations: Situation[];
  selectedSituation: Situation;
  onSelectSituation: (situation: Situation) => void;
  onStartPractice: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  situations,
  selectedSituation,
  onSelectSituation,
  onStartPractice,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-10 flex flex-col items-center">
      {/* Top Section */}
      <header className="text-center w-full max-w-2xl mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Real-Life English Practice for Exchange Students</span>
          <span className="text-indigo-300">·</span>
          <span>CEFR A2–B1</span>
        </div>

        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-indigo-500 flex items-center justify-center shadow-md text-white">
            <MessageCircleHeart className="w-6 h-6" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Campus Talk!
          </h1>
        </div>

        <p className="text-lg md:text-xl font-medium text-slate-700 mb-1">
          Speak English, Live Abroad.
        </p>
        <p className="text-sm md:text-base text-slate-500">
          Ready for your exchange student life? Choose a realistic situation and speak up with confidence.
        </p>
      </header>

      {/* Middle Section: Situations */}
      <section className="w-full mb-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>What would you like to practice today?</span>
          </h2>
          <span className="text-xs font-medium text-slate-500">
            4 Real Scenarios · 5 Turns Each
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {situations.map((sit) => {
            const isSelected = selectedSituation.id === sit.id;

            return (
              <button
                key={sit.id}
                type="button"
                onClick={() => onSelectSituation(sit)}
                className={`group relative text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer bg-white hover:shadow-md flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2.5 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform">
                      {sit.emoji}
                    </span>
                    <div>
                      <h3 className="font-bold text-base md:text-lg text-slate-900 flex items-center gap-2">
                        {sit.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {sit.partnerSummary}
                      </p>
                    </div>
                  </div>

                  {isSelected ? (
                    <span className="text-indigo-600 shrink-0">
                      <CheckCircle2 className="w-5 h-5 fill-indigo-100 text-indigo-600" />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0" />
                  )}
                </div>

                <p className="text-xs md:text-sm text-slate-600 leading-relaxed mb-4">
                  {sit.subtitle}
                </p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {/* Partner Avatars */}
                  <div className="flex items-center -space-x-2">
                    {sit.partnerAvatars.map((av) => (
                      <CharacterAvatar
                        key={av}
                        name={av}
                        size="sm"
                        className="ring-2 ring-white"
                      />
                    ))}
                  </div>

                  <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    {isSelected ? 'Selected' : 'Select'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Bottom Section: Preview & Start */}
      <footer className="w-full bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
              <Compass className="w-3.5 h-3.5" />
              <span>Selected Scenario Preview</span>
            </div>
            <h4 className="text-base font-bold text-slate-900">
              {selectedSituation.emoji} {selectedSituation.title}
            </h4>
            <p className="text-xs md:text-sm text-slate-600 max-w-xl">
              {selectedSituation.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Location: {selectedSituation.scenarioDetails}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartPractice}
            className="w-full md:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-sm hover:shadow-md transition-all duration-150 flex items-center justify-center gap-2.5 shrink-0 cursor-pointer active:scale-98"
          >
            <span>Start Practice</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Notice (Mandatory Requirement) */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Your voice is processed to turn it into text and is not recorded or saved.
          </span>
        </div>
      </footer>
    </div>
  );
};
