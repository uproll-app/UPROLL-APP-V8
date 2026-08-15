import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, BarChart2 } from 'lucide-react';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface InteractivePollProps {
  question?: string;
  initialOptions?: PollOption[];
  correctOptionId?: string;
  isWhiteMode?: boolean;
}

export const InteractivePoll: React.FC<InteractivePollProps> = ({
  question = "വരുന്ന ടി20 ലോകകപ്പിൽ ഇന്ത്യ കിരീടം നിലനിർത്തുമോ?",
  initialOptions = [
    { id: '1', text: 'തീർച്ചയായും സാധിക്കും', votes: 3120 },
    { id: '2', text: 'കടുത്ത മത്സരമുണ്ടാകും', votes: 1240 },
    { id: '3', text: 'മറ്റ് ടീമുകൾക്ക് സാധ്യത', votes: 410 },
  ],
  correctOptionId = '1',
  isWhiteMode = false,
}) => {
  const [options, setOptions] = useState<PollOption[]>(initialOptions);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

  const handleVote = (id: string) => {
    if (selectedOption !== null) return; // Prevent multi-voting
    setSelectedOption(id);
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, votes: opt.votes + 1 } : opt))
    );
  };

  const isCorrect = selectedOption === correctOptionId;

  return (
    <div className="space-y-2.5 w-full">

      {/* Poll Question (If present) */}
      {question && (
        <h3
          className={`text-sm sm:text-base font-extrabold leading-snug ${
            isWhiteMode ? 'text-slate-900' : 'text-white'
          }`}
        >
          {question}
        </h3>
      )}

      {/* Poll Radio Options List */}
      <div className="space-y-1.5 pt-0.5">
        {options.map((option) => {
          const currentTotal = totalVotes || 1;
          const percentage = Math.round((option.votes / currentTotal) * 100);
          const isSelected = selectedOption === option.id;

          let btnClass = isWhiteMode
            ? 'border-slate-300 bg-slate-100/80 hover:border-slate-400 text-slate-800'
            : 'border-zinc-800/90 bg-zinc-900/90 hover:border-zinc-700 active:scale-[0.99]';

          if (selectedOption !== null) {
            if (isSelected) {
              btnClass = isWhiteMode
                ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-extrabold shadow-sm'
                : 'border-[#A2D5B1] bg-[#17241C] text-white font-extrabold';
            } else {
              btnClass = isWhiteMode
                ? 'border-slate-200 bg-slate-100/50 text-slate-400 opacity-75'
                : 'border-zinc-800/80 bg-zinc-900/50 opacity-80';
            }
          }

          return (
            <button
              key={option.id}
              onClick={(e) => {
                e.stopPropagation();
                handleVote(option.id);
              }}
              disabled={selectedOption !== null}
              className={`w-full text-left relative overflow-hidden rounded-xl border px-3 py-2 transition-all cursor-pointer ${btnClass}`}
            >
              {/* Progress fill bar if voted */}
              {selectedOption !== null && (
                <div
                  className={`absolute left-0 top-0 bottom-0 transition-all duration-700 ease-out ${
                    isSelected
                      ? isWhiteMode
                        ? 'bg-emerald-200/50'
                        : 'bg-[#A2D5B1]/25'
                      : isWhiteMode
                      ? 'bg-slate-200/50'
                      : 'bg-zinc-800/60'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              {/* Content Row with Radio Button Circle */}
              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {isSelected ? (
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        isWhiteMode ? 'text-emerald-600' : 'text-[#A2D5B1]'
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-4 h-4 rounded-full border shrink-0 transition-colors ${
                        selectedOption !== null
                          ? isWhiteMode
                            ? 'border-slate-300'
                            : 'border-zinc-600'
                          : isWhiteMode
                          ? 'border-slate-400'
                          : 'border-zinc-500'
                      }`}
                    />
                  )}
                  <span
                    className={`text-xs sm:text-sm font-semibold truncate ${
                      isSelected
                        ? isWhiteMode
                          ? 'text-slate-950 font-extrabold'
                          : 'text-white font-extrabold'
                        : isWhiteMode
                        ? 'text-slate-800'
                        : 'text-zinc-200'
                    }`}
                  >
                    {option.text}
                  </span>
                </div>

                {selectedOption !== null && (
                  <span
                    className={`text-xs font-black shrink-0 ${
                      isSelected
                        ? isWhiteMode
                          ? 'text-emerald-700'
                          : 'text-[#A2D5B1]'
                        : isWhiteMode
                        ? 'text-slate-500'
                        : 'text-zinc-400'
                    }`}
                  >
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Simple Feedback Message */}
      {selectedOption !== null && (
        <div
          className={`p-2.5 rounded-xl border text-center font-extrabold text-xs animate-fade-in ${
            isCorrect
              ? 'bg-[#17241C] border-[#A2D5B1]/50 text-[#A2D5B1]'
              : 'bg-[#2B1A1A] border-red-500/40 text-red-300'
          }`}
        >
          {isCorrect ? 'congrats' : 'try butter luck next time'}
        </div>
      )}
    </div>
  );
};

