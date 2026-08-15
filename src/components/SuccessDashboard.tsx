import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, ShieldCheck, Sparkles, User, RefreshCw, Bell, ArrowRight, Zap, Award } from 'lucide-react';
import { UprollLogo } from './UprollLogo';

interface SuccessDashboardProps {
  phoneNumber: string;
  onReset: () => void;
}

export const SuccessDashboard: React.FC<SuccessDashboardProps> = ({
  phoneNumber,
  onReset,
}) => {
  useEffect(() => {
    // Trigger celebratory confetti on verification success
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#A2D5B1', '#FFFFFF', '#61C081', '#34D399'],
    });
  }, []);

  return (
    <div className="w-full min-h-full flex flex-col justify-between p-5 text-white animate-fade-in space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between pt-2">
        <UprollLogo size="sm" />
        <div className="flex items-center gap-2">
          <span className="bg-[#1A221C] text-[#A2D5B1] text-xs font-bold px-3 py-1 rounded-full border border-[#2B4232] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified
          </span>
          <button
            onClick={onReset}
            className="p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Reset to Welcome Flow"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-b from-[#141815] to-[#0D100E] border border-[#233527] rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#A2D5B1]/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="w-12 h-12 rounded-2xl bg-[#A2D5B1]/20 border border-[#A2D5B1]/40 flex items-center justify-center text-[#A2D5B1] mb-4">
          <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
        </div>

        <h2 className="text-2xl font-extrabold text-white tracking-tight mb-1">
          Welcome to Uproll!
        </h2>
        <p className="text-sm text-zinc-400 font-medium mb-4">
          Your account is active for <span className="text-white font-semibold">{phoneNumber}</span>
        </p>

        <div className="flex items-center gap-3 pt-2 border-t border-zinc-800/80">
          <div className="flex-1 bg-zinc-900/80 rounded-2xl p-3 border border-zinc-800">
            <div className="text-xs text-zinc-400 font-medium">Status</div>
            <div className="text-sm font-bold text-[#A2D5B1] flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-[#A2D5B1]" /> Active Pro
            </div>
          </div>
          <div className="flex-1 bg-zinc-900/80 rounded-2xl p-3 border border-zinc-800">
            <div className="text-xs text-zinc-400 font-medium">Rewards</div>
            <div className="text-sm font-bold text-white flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" /> 500 Pts
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Items */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
          Explore Features
        </h3>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between hover:border-zinc-700 transition-colors group cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-[#A2D5B1]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Daily Rolls & Digest</div>
              <div className="text-xs text-zinc-400">Customized feeds updated live</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between hover:border-zinc-700 transition-colors group cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-sky-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Security Alerts</div>
              <div className="text-xs text-zinc-400">Instant SMS notifications enabled</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
        </div>
      </div>

      {/* Bottom Action */}
      <button
        onClick={onReset}
        className="w-full py-4 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-sm transition-all active:scale-[0.98] cursor-pointer"
      >
        Test Verification Flow Again
      </button>
    </div>
  );
};
