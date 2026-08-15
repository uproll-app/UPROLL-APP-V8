import React, { useState } from 'react';
import {
  Settings,
  X,
  Bell,
  Moon,
  Sun,
  Video,
  LayoutGrid,
  ExternalLink,
  Check
} from 'lucide-react';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isWhiteMode: boolean;
  onToggleWhiteMode: (value: boolean) => void;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  isWhiteMode,
  onToggleWhiteMode,
}) => {
  const [notifications, setNotifications] = useState<boolean>(true);
  const [autoplay, setAutoplay] = useState<boolean>(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-sm sm:max-w-md rounded-[28px] border shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar transition-colors ${
          isWhiteMode
            ? 'bg-slate-50 border-slate-200 text-slate-900'
            : 'bg-[#12151C] border-zinc-800 text-white'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">App Settings</h2>
              <p className={`text-xs ${isWhiteMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                App preferences & notifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
              isWhiteMode
                ? 'bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Setting 1: Notifications */}
        <div
          className={`rounded-2xl p-4 border flex items-center justify-between gap-3 shadow-sm ${
            isWhiteMode
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-zinc-900/90 border-zinc-800 text-white'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Bell className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">Notifications</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {notifications ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className={`text-xs ${isWhiteMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                Receiving breaking news & story updates
              </p>
            </div>
          </div>

          <button
            onClick={() => setNotifications(!notifications)}
            className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer border ${
              notifications
                ? 'bg-emerald-500 border-emerald-400'
                : 'bg-zinc-700 border-zinc-600'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                notifications ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Setting 2: Theme Mode */}
        <div
          className={`rounded-2xl p-4 border space-y-3 shadow-sm ${
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
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">Theme Mode</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {isWhiteMode ? 'WHITE MODE' : 'DARK MODE'}
                </span>
              </div>
              <p className={`text-xs ${isWhiteMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                Switch between Dark and White (Light) theme
              </p>
            </div>
          </div>

          {/* Theme Mode Segmented Button Switcher */}
          <div
            className={`p-1 rounded-2xl flex items-center gap-1 border ${
              isWhiteMode
                ? 'bg-slate-100 border-slate-200'
                : 'bg-zinc-950/80 border-zinc-800'
            }`}
          >
            <button
              onClick={() => onToggleWhiteMode(true)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isWhiteMode
                  ? 'bg-white text-slate-900 shadow-md border border-slate-300'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sun className={`w-3.5 h-3.5 ${isWhiteMode ? 'text-amber-500' : ''}`} />
              <span>White Mode</span>
            </button>

            <button
              onClick={() => onToggleWhiteMode(false)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                !isWhiteMode
                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Moon className={`w-3.5 h-3.5 ${!isWhiteMode ? 'text-emerald-400' : ''}`} />
              <span>Dark Mode</span>
            </button>
          </div>
        </div>

        {/* Setting 3: Video Autoplay */}
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
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">Video Autoplay</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {autoplay ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className={`text-xs ${isWhiteMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                Autoplay featured videos & movie trailers
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

        {/* Setting 4: Admin/Publisher Portal */}
        <div
          className={`rounded-2xl p-4 border flex items-center justify-between gap-3 shadow-sm transition-all hover:scale-[1.01] cursor-pointer ${
            isWhiteMode
              ? 'bg-emerald-50/60 border-emerald-300 text-slate-900'
              : 'bg-zinc-900/70 border-emerald-500/30 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300">
              Publish content, manage articles & polls
            </span>
          </div>
          <ExternalLink className="w-4 h-4 text-emerald-500 shrink-0" />
        </div>
      </div>
    </div>
  );
};
