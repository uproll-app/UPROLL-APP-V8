import React, { useState } from 'react';
import { HelpCircle, MessageSquare, Send, CheckCircle2, Share2, Sparkles, User, ThumbsUp, Heart } from 'lucide-react';
import { ArticleData } from './ArticleDetailView';
import { submitReaderAnswerToFirestore } from '../lib/newsService';

interface AskReadersCardProps {
  article: ArticleData;
  isWhiteMode?: boolean;
  onShare?: () => void;
}

export const AskReadersCard: React.FC<AskReadersCardProps> = ({
  article,
  isWhiteMode = false,
  onShare,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerInput, setAnswerInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showThankYou, setShowThankYou] = useState<boolean>(false);
  const [localAnswers, setLocalAnswers] = useState<Array<{ id: string; user?: string; text: string; date?: string }>>(
    article.readerAnswers || []
  );

  const themeColor = article.cardThemeColor || '#8B5CF6';
  const badgeTag = article.badgeTag || 'ASK READERS • POLL & Q&A';
  const options = article.choiceOptions || [];

  const handleVoteOption = (optText: string) => {
    setSelectedOption(optText);
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim()) return;

    setIsSubmitting(true);
    const newAnswerText = answerInput.trim();
    const tempAnswer = {
      id: `ans-${Date.now()}`,
      user: 'Verified Reader',
      text: newAnswerText,
      date: 'Just now',
    };

    setLocalAnswers([tempAnswer, ...localAnswers]);
    setAnswerInput('');

    try {
      if (article.id) {
        await submitReaderAnswerToFirestore(article.id, newAnswerText, 'Verified Reader');
      }
      setShowThankYou(true);
      setTimeout(() => setShowThankYou(false), 3500);
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col flex-1 h-full select-none border border-slate-800/60 relative"
      style={{
        backgroundColor: themeColor,
        backgroundImage: article.cardCoverImage
          ? `linear-gradient(to bottom, rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.95)), url(${article.cardCoverImage})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-md border border-white/20">
            {badgeTag}
          </span>
          <span className="text-[10px] font-extrabold text-purple-200 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-400/30">
            {article.category || 'Fan Opinion'}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onShare) onShare();
          }}
          className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all cursor-pointer"
          title="Share Q&A"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Question Body */}
      <div className="px-4 sm:px-5 pb-4 flex-1 flex flex-col justify-between space-y-4 z-10">
        <div className="space-y-3">
          {/* Question Text */}
          <h3 className="text-base sm:text-lg font-black text-white leading-snug drop-shadow-xs">
            {article.title || article.summary}
          </h3>

          {/* Optional Choice Buttons if configured */}
          {options.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="text-[10px] font-bold text-white/75 uppercase tracking-wider">
                Quick Options:
              </div>
              <div className="grid grid-cols-1 gap-2">
                {options.map((opt, idx) => {
                  const optText = typeof opt === 'string' ? opt : opt.text;
                  const isSelected = selectedOption === optText;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleVoteOption(optText)}
                      className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer border ${
                        isSelected
                          ? 'bg-white text-slate-900 border-white shadow-md'
                          : 'bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-xs'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span>{optText}</span>
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reader Comment / Response Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-white/90 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-purple-200" />
                <span>Reader Opinions ({localAnswers.length})</span>
              </span>
              <span className="text-[9px] text-white/70">Live Opinion Feed</span>
            </div>

            {/* List of recent answers */}
            {localAnswers.length > 0 ? (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 no-scrollbar">
                {localAnswers.slice(0, 3).map((ans, idx) => (
                  <div
                    key={ans.id || idx}
                    className="p-2 bg-black/40 border border-white/15 rounded-xl text-white text-xs backdrop-blur-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-purple-200 font-semibold mb-0.5">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-purple-300" />
                        <span>{ans.user || 'Reader'}</span>
                      </span>
                      <span className="text-white/60">{ans.date || 'Just now'}</span>
                    </div>
                    <p className="text-[11px] text-white/90 leading-tight">{ans.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2.5 bg-black/25 rounded-xl border border-white/10 text-center">
                <p className="text-[10px] text-white/80 font-medium">
                  Be the first to share your opinion on this topic!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Opinion Input Form */}
        <div className="space-y-1.5 pt-1">
          {showThankYou && (
            <div className="p-2 bg-emerald-500/90 text-white text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5 animate-fadeIn shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Thank you! Your opinion is live on the dashboard.</span>
            </div>
          )}

          <form onSubmit={handleSubmitAnswer} className="flex items-center gap-2">
            <input
              type="text"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder="Type your opinion / reply..."
              className="flex-1 bg-white/20 border border-white/30 focus:border-white focus:bg-white/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/60 focus:outline-none backdrop-blur-md transition-all font-medium"
            />
            <button
              type="submit"
              disabled={isSubmitting || !answerInput.trim()}
              className="p-2.5 bg-white hover:bg-slate-100 disabled:opacity-40 text-purple-900 rounded-xl font-bold shadow-md transition-all cursor-pointer shrink-0"
              title="Post Opinion"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
