import React, { useState, useEffect } from 'react';
import { MobileFrame } from './components/MobileFrame';
import { UprollLogo } from './components/UprollLogo';
import { StoryProgress } from './components/StoryProgress';
import { OtpModal } from './components/OtpModal';
import { PhoneInputModal } from './components/PhoneInputModal';
import { CompleteModal } from './components/CompleteModal';
import { SuccessDashboard } from './components/SuccessDashboard';
import { FeedView } from './components/FeedView';
import { FlutterCodeViewer } from './components/FlutterCodeViewer';
import { WhiteCmsDashboard } from './components/WhiteCmsDashboard';
import { AppScreen } from './types';
import { Smartphone, LayoutGrid, Sparkles, Columns2, ExternalLink } from 'lucide-react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth } from './lib/firebase';

type AdminRole = 'admin' | 'editor' | 'writer' | 'analyst' | 'viewer';

const DASHBOARD_ROLES = new Set<AdminRole>([
  'admin',
  'editor',
  'writer',
  'analyst',
  'viewer',
]);

function AdminAccessGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setRole(null);
      if (!nextUser) {
        setChecking(false);
        return;
      }

      const token = await nextUser.getIdTokenResult(true);
      const nextRole = token.claims.role as AdminRole | undefined;
      setRole(nextRole && DASHBOARD_ROLES.has(nextRole) ? nextRole : null);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return <div className="min-h-screen grid place-items-center bg-slate-950 text-white">Checking admin access...</div>;
  }

  if (!user) return <AdminLogin />;

  if (!role) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 px-6 text-center text-white">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-black">Dashboard access is not assigned</h1>
          <p className="text-slate-400">Ask an administrator to assign an admin, editor, writer, analyst, or viewer role.</p>
          <button onClick={() => signOut(auth)} className="rounded-xl bg-emerald-500 px-4 py-2 font-bold text-slate-950">Sign out</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setError('Sign-in failed. Use an invited employee account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 grid place-items-center px-5 text-white">
      <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-2xl">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-400">UPROLL</p>
          <h1 className="mt-2 text-3xl font-black">Editorial Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in with your invited employee account.</p>
        </div>
        <label className="block text-sm font-bold">Company email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400" /></label>
        <label className="block text-sm font-bold">Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400" /></label>
        {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        <button disabled={loading} className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-black text-slate-950 disabled:opacity-50">{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </main>
  );
}

export default function App() {
  const [viewMode, setViewMode] = useState<'cms' | 'reader' | 'split'>('cms');
  const [screen, setScreen] = useState<AppScreen>('feed');
  const [prevScreen, setPrevScreen] = useState<AppScreen>('feed');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [storyStep, setStoryStep] = useState<number>(1);
  const [showFlutterCode, setShowFlutterCode] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Initialize viewMode based on URL parameter if opened in new tab (e.g. ?view=cms)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (viewParam === 'cms' || viewParam === 'reader' || viewParam === 'split') {
        setViewMode(viewParam as 'cms' | 'reader' | 'split');
      }
    } catch (e) {
      // Ignore URL parsing errors in restricted sandbox
    }
  }, []);

  const handleOpenDashboardInNewTab = () => {
    try {
      const targetUrl = new URL(window.location.href);
      targetUrl.searchParams.set('view', 'cms');
      window.open(targetUrl.toString(), '_blank');
    } catch (e) {
      window.open(window.location.href, '_blank');
    }
  };

  const handleGetStarted = () => {
    setScreen('feed');
  };

  const handleOpenLogin = () => {
    setPrevScreen(screen);
    setScreen('phone_entry');
  };

  const handleReset = () => {
    setScreen('landing');
    setStoryStep(0);
    setIsLoggedIn(false);
  };

  const handleCloseLogin = () => {
    setScreen(prevScreen || 'feed');
  };

  // Render Mobile Reader Content
  const renderMobileContent = () => (
    <MobileFrame
      activeScreen={screen}
      onReset={handleReset}
      onOpenFlutterCode={() => setShowFlutterCode(true)}
    >
      {/* Landing / Welcome Screen */}
      {screen === 'landing' && (
        <div className="flex-1 flex flex-col justify-between px-5 pt-2 pb-6 min-h-full animate-fade-in relative z-10">
          {/* Top Story Header */}
          <StoryProgress
            totalSteps={3}
            activeStep={storyStep}
            onStepClick={(step) => setStoryStep(step)}
          />

          {/* Center Brand Logo */}
          <div className="flex-1 flex flex-col items-center justify-center my-auto py-12">
            <UprollLogo size="lg" />
          </div>

          {/* Bottom Action Buttons */}
          <div className="w-full space-y-3.5 pt-4">
            <button
              onClick={handleGetStarted}
              className="w-full py-4 px-6 rounded-full bg-[#A2D5B1] hover:bg-[#92C7A1] active:scale-[0.98] text-[#0A0B0E] font-extrabold text-base transition-all shadow-lg cursor-pointer flex items-center justify-center"
            >
              Get Started
            </button>

            <button
              onClick={handleOpenLogin}
              className="w-full py-4 px-6 rounded-full bg-[#F4F4F5] hover:bg-white active:scale-[0.98] text-[#0A0B0E] font-extrabold text-base transition-all shadow-md cursor-pointer flex items-center justify-center"
            >
              Log In
            </button>
          </div>
        </div>
      )}

      {/* Main Movie / News Feed Screen */}
      {screen === 'feed' && (
        <FeedView
          onOpenLogin={handleOpenLogin}
          isLoggedIn={isLoggedIn}
        />
      )}

      {/* Mobile Number Entry Modal Screen */}
      {screen === 'phone_entry' && (
        <div className="flex-1 flex flex-col justify-between px-5 pt-2 pb-2 min-h-full relative">
          <StoryProgress totalSteps={3} activeStep={0} />

          <div className="flex-1 flex items-center justify-center my-auto">
            <UprollLogo size="lg" blurred={true} />
          </div>

          <PhoneInputModal
            initialPhone={phoneNumber}
            onClose={handleCloseLogin}
            onBack={handleCloseLogin}
            onSubmitPhone={(p) => {
              setPhoneNumber(p);
              setScreen('otp_modal');
            }}
          />
        </div>
      )}

      {/* Confirmation Code Modal Screen */}
      {screen === 'otp_modal' && (
        <div className="flex-1 flex flex-col justify-between px-5 pt-2 pb-2 min-h-full relative">
          <StoryProgress totalSteps={3} activeStep={1} />

          <div className="flex-1 flex items-center justify-center my-auto py-8">
            <UprollLogo size="lg" blurred={true} />
          </div>

          <OtpModal
            phoneNumber={phoneNumber || '+91 8782468386'}
            onClose={handleCloseLogin}
            onBack={() => setScreen('phone_entry')}
            onVerifySuccess={() => {
              setIsLoggedIn(true);
              setScreen('complete_modal');
            }}
            onChangePhoneNumber={() => setScreen('phone_entry')}
          />
        </div>
      )}

      {/* Confirmation Complete Modal Screen */}
      {screen === 'complete_modal' && (
        <div className="flex-1 flex flex-col justify-between px-5 pt-2 pb-2 min-h-full relative">
          <StoryProgress totalSteps={3} activeStep={2} />

          <div className="flex-1 flex items-center justify-center my-auto py-8">
            <UprollLogo size="lg" blurred={true} />
          </div>

          <CompleteModal
            onComplete={() => {
              setIsLoggedIn(true);
              setScreen('feed');
            }}
          />
        </div>
      )}

      {/* Verified User Screen */}
      {screen === 'dashboard' && (
        <SuccessDashboard phoneNumber={phoneNumber || '+91 8782468386'} onReset={handleReset} />
      )}
    </MobileFrame>
  );

  return (
    <AdminAccessGate>
    <div className={`w-full bg-[#070A10] text-white flex flex-col ${viewMode === 'cms' ? 'h-screen overflow-hidden p-0' : 'min-h-screen p-2 sm:p-4'} font-sans antialiased`}>
      {/* Top Header Mode Switcher */}
      <header className={`w-full shrink-0 ${viewMode === 'cms' ? 'px-3 py-1.5 bg-slate-950 border-b border-slate-800/80 z-40' : 'max-w-7xl mb-2 px-2 mx-auto'} flex items-center justify-between gap-2 flex-wrap transition-all`}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-black text-[11px] tracking-tight">
              UPROLL
            </span>
            <span className="text-slate-500 font-medium text-[10px] hidden sm:inline">
              | Cinema Short-News
            </span>
          </div>
        </div>

        {/* Center Pill Switcher */}
        <div className="flex items-center gap-0.5 bg-slate-900/90 backdrop-blur-md p-0.5 rounded-full border border-slate-800 shadow-xs">
          <button
            onClick={() => setViewMode('cms')}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer ${
              viewMode === 'cms'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            <span>CMS Dashboard</span>
          </button>

          <button
            onClick={() => setViewMode('reader')}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer ${
              viewMode === 'reader'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span>Mobile App</span>
          </button>

          <button
            onClick={() => setViewMode('split')}
            className={`hidden lg:flex px-2.5 py-1 rounded-full items-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Side-by-side CMS & Live App Preview"
          >
            <Columns2 className="w-3 h-3" />
            <span>Dual View</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleOpenDashboardInNewTab}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full font-bold border border-slate-800 text-[11px] transition-colors cursor-pointer"
            title="Open Dashboard in a standalone browser tab"
          >
            <ExternalLink className="w-3 h-3 text-indigo-400" />
            <span className="hidden sm:inline">Open in New Tab</span>
          </button>

          <button
            onClick={() => setShowFlutterCode(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full font-bold border border-slate-800 text-[11px] transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Flutter Code</span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className={`w-full flex-1 flex items-stretch justify-center ${viewMode === 'cms' ? 'min-h-0 overflow-hidden' : ''}`}>
        {viewMode === 'cms' && (
          <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden">
            <WhiteCmsDashboard
              onOpenMobileReader={() => {
                setViewMode('reader');
                setScreen('feed');
              }}
            />
          </div>
        )}

        {viewMode === 'reader' && (
          <div className="py-2 animate-fade-in flex items-center justify-center">
            {renderMobileContent()}
          </div>
        )}

        {viewMode === 'split' && (
          <div className="w-full max-w-[1700px] grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-fade-in py-2 px-3">
            <div className="xl:col-span-8">
              <WhiteCmsDashboard
                onOpenMobileReader={() => {
                  setViewMode('reader');
                  setScreen('feed');
                }}
              />
            </div>
            <div className="xl:col-span-4 flex justify-center sticky top-4">
              {renderMobileContent()}
            </div>
          </div>
        )}
      </main>

      {/* Flutter Code Explorer Modal */}
      <FlutterCodeViewer
        isOpen={showFlutterCode}
        onClose={() => setShowFlutterCode(false)}
      />
    </div>
    </AdminAccessGate>
  );
}


