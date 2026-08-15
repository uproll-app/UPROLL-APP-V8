import React, { useState } from 'react';
import {
  UserCheck,
  X,
  User,
  Clock,
  Shield,
  LogOut,
  Edit2,
  Moon,
  Sun,
  Bell,
  Video,
  Check
} from 'lucide-react';

interface ProfileSectionProps {
  onClose: () => void;
  isWhiteMode: boolean;
  onToggleWhiteMode: (value: boolean) => void;
  onLogout?: () => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  onClose,
  isWhiteMode,
  onToggleWhiteMode,
  onLogout,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'activity' | 'info'>('profile');
  const [breakingNews, setBreakingNews] = useState<boolean>(true);
  const [autoplay, setAutoplay] = useState<boolean>(true);

  return (
    <div
      className={`flex-1 flex flex-col p-4 sm:p-6 space-y-5 overflow-y-auto max-h-full transition-colors ${
        isWhiteMode ? 'bg-slate-100 text-slate-900' : 'bg-[#08090C] text-white'
      }`}
    >
      {/* 1. Header with Close Button */}
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Profile & Activity</h1>
          <p className={`text-xs ${isWhiteMode ? 'text-slate-500' : 'text-zinc-400'}`}>
            Manage your account, cinema preferences, saved items & history
          </p>
        </div>
        <button
          onClick={onClose}
          className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
            isWhiteMode
              ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-200'
              : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
          }`}
          title="Close Profile"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Top Pill Navigation Sub-Tabs Bar */}
      <div
        className={`p-1.5 rounded-2xl flex items-center justify-between gap-1 border shadow-sm ${
          isWhiteMode
            ? 'bg-white border-slate-200'
            : 'bg-zinc-900/90 border-zinc-800'
        }`}
      >
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'profile'
              ? isWhiteMode
                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-sm'
                : 'bg-[#A2D5B1]/20 text-[#A2D5B1] border border-[#A2D5B1]/40'
              : isWhiteMode
              ? 'text-slate-500 hover:text-slate-900'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile</span>
        </button>

        <button
          onClick={() => setActiveSubTab('activity')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'activity'
              ? isWhiteMode
                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-sm'
                : 'bg-[#A2D5B1]/20 text-[#A2D5B1] border border-[#A2D5B1]/40'
              : isWhiteMode
              ? 'text-slate-500 hover:text-slate-900'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Activity</span>
        </button>

        <button
          onClick={() => setActiveSubTab('info')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'info'
              ? isWhiteMode
                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-sm'
                : 'bg-[#A2D5B1]/20 text-[#A2D5B1] border border-[#A2D5B1]/40'
              : isWhiteMode
              ? 'text-slate-500 hover:text-slate-900'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>App Info</span>
        </button>
      </div>

      {/* Sub-Tab 1: Profile View */}
      {activeSubTab === 'profile' && (
        <div className="space-y-5 animate-fade-in">
          {/* Member Profile Main Card (Matching Screenshot 2) */}
          <div
            className={`rounded-2xl p-4 border space-y-3.5 shadow-md ${
              isWhiteMode
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-zinc-900/90 border-zinc-800 text-white'
            }`}
          >
            {/* Header: UserCheck Icon + Subtitle */}
            <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800/40">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold">Member Profile (3546343434)</h3>
                <p className={`text-[11px] ${isWhiteMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                  Profile editing unlocked
                </p>
              </div>
            </div>

            {/* Profile Avatar Box */}
            <div
              className={`rounded-xl p-3 flex items-center justify-between border ${
                isWhiteMode
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-zinc-950/80 border-zinc-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#A2D5B1] text-slate-950 font-black text-sm flex items-center justify-center shadow-md">
                  VU
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-600 dark:text-[#A2D5B1]">Verified User</p>
                  <p className="text-sm font-extrabold tracking-wide">3546343434</p>
                </div>
              </div>

              {/* Actions: Logout & Edit */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onLogout}
                  className="w-9 h-9 rounded-full bg-rose-500/15 hover:bg-rose-500/30 text-rose-500 border border-rose-500/30 flex items-center justify-center transition-all cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <button
                  className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                    isWhiteMode
                      ? 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                  }`}
                  title="Edit Profile"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* READER SETTINGS Section Header */}
          <div className="space-y-3 pt-1">
            <h3 className={`text-xs font-black uppercase tracking-widest px-1 ${
              isWhiteMode ? 'text-slate-500' : 'text-zinc-400'
            }`}>
              READER SETTINGS
            </h3>

            {/* Card 1: Dark Mode Toggle */}
            <div
              className={`rounded-2xl p-4 border flex items-center justify-between gap-3 shadow-sm ${
                isWhiteMode
                  ? 'bg-white border-slate-200 text-slate-900'
                  : 'bg-zinc-900/90 border-zinc-800 text-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <Moon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-sm font-bold">Dark Mode</span>
                  <p className={`text-xs ${isWhiteMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Eye-safe OLED dark canvas
                  </p>
                </div>
              </div>

              <button
                onClick={() => onToggleWhiteMode(!isWhiteMode)}
                className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer border ${
                  !isWhiteMode
                    ? 'bg-emerald-500 border-emerald-400'
                    : 'bg-slate-300 border-slate-400'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    !isWhiteMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Card 2: Breaking News Alerts */}
            <div
              className={`rounded-2xl p-4 border flex items-center justify-between gap-3 shadow-sm ${
                isWhiteMode
                  ? 'bg-white border-slate-200 text-slate-900'
                  : 'bg-zinc-900/90 border-zinc-800 text-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-sm font-bold">Breaking News Alerts (ON)</span>
                  <p className={`text-xs ${isWhiteMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Instant top story notifications
                  </p>
                </div>
              </div>

              <button
                onClick={() => setBreakingNews(!breakingNews)}
                className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer border ${
                  breakingNews
                    ? 'bg-emerald-500 border-emerald-400'
                    : 'bg-zinc-700 border-zinc-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    breakingNews ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Card 3: Video Autoplay */}
            <div
              className={`rounded-2xl p-4 border flex items-center justify-between gap-3 shadow-sm ${
                isWhiteMode
                  ? 'bg-white border-slate-200 text-slate-900'
                  : 'bg-zinc-900/90 border-zinc-800 text-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                  <Video className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-sm font-bold">Video Autoplay (ON)</span>
                  <p className={`text-xs ${isWhiteMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Autoplay featured videos & trailers in feed
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAutoplay(!autoplay)}
                className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer border ${
                  autoplay
                    ? 'bg-emerald-500 border-emerald-400'
                    : 'bg-zinc-700 border-zinc-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    autoplay ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Activity View */}
      {activeSubTab === 'activity' && (
        <div className="space-y-3 animate-fade-in">
          <div
            className={`rounded-2xl p-4 border text-center space-y-2 ${
              isWhiteMode
                ? 'bg-white border-slate-200 text-slate-800'
                : 'bg-zinc-900/90 border-zinc-800 text-zinc-300'
            }`}
          >
            <Clock className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold">Recent Reading Activity</h3>
            <p className="text-xs text-zinc-400">You have read 14 short stories & participated in 3 polls today.</p>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: App Info View */}
      {activeSubTab === 'info' && (
        <div className="space-y-3 animate-fade-in">
          <div
            className={`rounded-2xl p-4 border space-y-2 text-center ${
              isWhiteMode
                ? 'bg-white border-slate-200 text-slate-800'
                : 'bg-zinc-900/90 border-zinc-800 text-zinc-300'
            }`}
          >
            <Shield className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-extrabold">Uproll News v2.4.1</h3>
            <p className="text-xs text-zinc-400">Ultra-fast Malayalam cinema & entertainment news shorts reader.</p>
          </div>
        </div>
      )}
    </div>
  );
};
