import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, Share2, Award, RefreshCw } from 'lucide-react';

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizData {
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
}

interface InteractiveQuizCardProps {
  featureImage?: string;
  quiz?: QuizData;
  publishedTime?: string;
  isWhiteMode?: boolean;
  onShare?: () => void;
}

const DEFAULT_QUIZ: QuizData = {
  question: "ഏതു സിനിമയിലെ അഭിനയത്തിനാണ് മോഹൻലാലിന് മികച്ച നടനുള്ള ആദ്യ ദേശീയ ചലച്ചിത്ര അവാർഡ് ലഭിച്ചത്?",
  options: [
    { id: '1', text: 'കീരീടം (1989)' },
    { id: '2', text: 'ഭരതം (1991)' },
    { id: '3', text: 'വാനപ്രസ്ഥം (1999)' },
    { id: '4', text: 'ഇരുവർ (1997)' },
  ],
  correctOptionId: '2',
  explanation: '1991-ൽ റിലീസ് ചെയ്ത ഭരതം എന്ന ചിത്രത്തിലെ കല്ലൂർ ഗോപിനാഥൻ എന്ന കഥാപാത്രത്തിനാണ് മോഹൻലാലിന് മികച്ച നടനുള്ള ആദ്യ ദേശീയ പുരസ്കാരം ലഭിച്ചത്.',
};

export const InteractiveQuizCard: React.FC<InteractiveQuizCardProps> = ({
  featureImage = 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1000&auto=format&fit=crop',
  quiz = DEFAULT_QUIZ,
  publishedTime = '5m ago',
  isWhiteMode = false,
  onShare,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isSubmitted = selectedId !== null;
  const isCorrect = selectedId === quiz.correctOptionId;
  const correctOption = quiz.options.find((opt) => opt.id === quiz.correctOptionId);

  const handleSelectOption = (id: string) => {
    if (isSubmitted) return;
    setSelectedId(id);
  };

  const handleReset = () => {
    setSelectedId(null);
  };

  return (
    <div
      className={`rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col flex-1 h-full select-none ${
        isWhiteMode ? 'bg-white text-slate-900 shadow-xl' : 'bg-black text-white'
      }`}
      style={{ backgroundColor: isWhiteMode ? '#ffffff' : '#000000' }}
    >
      {/* 1. Top Image Banner with Share & Quiz Badge */}
      <div className="relative w-full h-[180px] sm:h-[210px] rounded-t-[28px] sm:rounded-t-[32px] rounded-b-none overflow-hidden bg-zinc-900 shrink-0 shadow-sm">
        <img
          src={featureImage}
          alt="Quiz topic"
          className="w-full h-full object-cover pointer-events-none"
        />
        <div
          className={`absolute inset-0 ${
            isWhiteMode
              ? 'hidden'
              : 'bg-gradient-to-t from-black/75 via-transparent to-black/30'
          }`}
        />

        {/* Top Right Share Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onShare) onShare();
          }}
          className={`absolute top-3.5 right-3.5 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer border ${
            isWhiteMode
              ? 'bg-white/90 hover:bg-white text-slate-800 border-slate-200'
              : 'bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border-white/10'
          }`}
          title="Share Quiz"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Quiz Question & Options Box */}
      <div className="p-4 sm:p-4.5 space-y-3 flex-1 flex flex-col justify-between overflow-hidden">
        <div className="space-y-2">
          {/* Published Time - Very thin font small size */}
          <p className="text-[10px] sm:text-[11px] font-thin text-zinc-400 tracking-wider">
            {publishedTime}
          </p>

          {/* Question Text */}
          <h3 className={`text-sm sm:text-base font-extrabold leading-snug ${isWhiteMode ? 'text-slate-900' : 'text-white'}`}>
            {quiz.question}
          </h3>

          {/* Options Grid / List */}
          <div className="space-y-2 pt-1">
            {quiz.options.map((opt) => {
              const isThisSelected = selectedId === opt.id;
              const isThisCorrect = opt.id === quiz.correctOptionId;

              let btnStyle = isWhiteMode
                ? 'border-slate-300 bg-slate-100/80 hover:border-slate-400 text-slate-800'
                : 'border-zinc-800/90 bg-zinc-900/90 hover:border-zinc-700 text-zinc-200';
              let badgeIcon = null;

              if (isSubmitted) {
                if (isThisCorrect) {
                  btnStyle = isWhiteMode
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold shadow-sm'
                    : 'border-[#A2D5B1] bg-[#17241C] text-[#A2D5B1] font-bold shadow-md shadow-[#A2D5B1]/10';
                  badgeIcon = <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
                } else if (isThisSelected && !isThisCorrect) {
                  btnStyle = 'border-red-500 bg-red-950/40 text-red-400 font-bold';
                  badgeIcon = <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
                } else {
                  btnStyle = isWhiteMode
                    ? 'border-slate-200 bg-slate-100/40 text-slate-400 opacity-60'
                    : 'border-zinc-800/60 bg-zinc-900/40 opacity-50 text-zinc-400';
                }
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  disabled={isSubmitted}
                  className={`w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer ${btnStyle}`}
                >
                  <span className="leading-snug">{opt.text}</span>
                  {badgeIcon ? (
                    badgeIcon
                  ) : (
                    <div className={`w-4 h-4 rounded-full border shrink-0 ${isWhiteMode ? 'border-slate-400' : 'border-zinc-600'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Simplified Feedback Banner after Answer */}
        {isSubmitted && (
          <div
            className={`p-3 rounded-xl border text-center font-extrabold text-xs animate-fade-in flex items-center justify-between ${
              isCorrect
                ? 'bg-[#17241C] border-[#A2D5B1]/50 text-[#A2D5B1]'
                : 'bg-[#2B1A1A] border-red-500/40 text-red-300'
            }`}
          >
            <span>{isCorrect ? 'congrats' : 'try butter luck next time'}</span>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer text-white"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
