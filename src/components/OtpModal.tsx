import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface OtpModalProps {
  phoneNumber: string;
  onClose: () => void;
  onBack: () => void;
  onVerifySuccess: (code: string) => void;
  onChangePhoneNumber?: () => void;
}

export const OtpModal: React.FC<OtpModalProps> = ({
  phoneNumber,
  onClose,
  onBack,
  onVerifySuccess,
  onChangePhoneNumber,
}) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(23); // Exactly 23s as shown in screenshot
  const [isResendDisabled, setIsResendDisabled] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    setErrorMsg('');
    // Allow only digits
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    // Handle single digit input
    if (value.length <= 1) {
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-advance focus
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (value.length === 6) {
      // Handle multi-character copy-paste
      const pastedDigits = value.slice(0, 6).split('');
      setOtp(pastedDigits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedText)) {
      const digits = pastedText.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleAutoFill = () => {
    setErrorMsg('');
    const autoCode = ['1', '2', '3', '4', '5', '6'];
    setOtp(autoCode);
    inputRefs.current[5]?.focus();
  };

  const handleResendCode = () => {
    if (isResendDisabled) return;
    setTimer(30);
    setIsResendDisabled(true);
    setOtp(['', '', '', '', '', '']);
    setErrorMsg('');
    inputRefs.current[0]?.focus();
  };

  const fullCode = otp.join('');
  const isComplete = fullCode.length === 6;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isComplete) return;

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onVerifySuccess(fullCode);
    }, 600);
  };

  return (
    <div className="w-full flex flex-col items-center justify-end relative z-20">
      {/* Floating Timer Badge (Image 3) */}
      <div className="mb-3 px-4 py-1.5 bg-[#121318]/90 border border-zinc-800 rounded-full text-white font-bold text-xs shadow-lg backdrop-blur-md animate-fade-in flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#A2D5B1] animate-pulse"></span>
        <span>{timer > 0 ? `${timer}` : 'Ready'}</span>
      </div>

      {/* Main Bottom Sheet / Modal Card */}
      <div className="w-full bg-white text-slate-900 rounded-t-[32px] sm:rounded-t-[36px] rounded-b-[24px] p-5 sm:p-6 shadow-2xl transition-all duration-300 animate-slide-up border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-700 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#A2D5B1]"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Confirmation Code
          </h2>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-700 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#A2D5B1]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 6 OTP Input Boxes */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            {otp.map((digit, index) => {
              const isFocused = inputRefs.current[index] === document.activeElement;
              return (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`w-10 h-13 sm:w-12 sm:h-14 text-center font-bold text-xl sm:text-2xl rounded-2xl transition-all focus:outline-none ${
                    digit
                      ? 'border-2 border-[#A2D5B1] bg-white text-slate-900 shadow-xs'
                      : isFocused
                      ? 'border-2 border-[#A2D5B1] bg-[#F2F8F4] text-slate-900 shadow-sm ring-2 ring-[#A2D5B1]/20'
                      : 'border border-slate-200 bg-slate-50/70 text-slate-900 hover:border-slate-300'
                  }`}
                  aria-label={`Digit ${index + 1}`}
                />
              );
            })}
          </div>

          {/* Subtext info */}
          <p className="text-center text-xs sm:text-sm text-slate-500 font-medium leading-relaxed px-2">
            To confirm your account, enter the 6-digit code sent to{' '}
            <button
              type="button"
              onClick={onChangePhoneNumber}
              className="font-bold text-slate-900 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              {phoneNumber}
            </button>
          </p>

          {/* Auto-fill Prompt Pill Button */}
          <div className="flex justify-center pt-0.5">
            <button
              type="button"
              onClick={handleAutoFill}
              className="bg-[#EBF5EE] hover:bg-[#E0F0E5] text-[#21613A] border border-[#BEE2C8] text-xs sm:text-sm font-semibold py-2 px-3.5 rounded-full flex items-center gap-1.5 transition-all active:scale-98 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 fill-[#21613A]/20" />
              <span>Auto-fill Verification OTP: 123456</span>
            </button>
          </div>

          {errorMsg && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Next Button */}
          <button
            type="submit"
            disabled={!isComplete || isVerifying}
            className={`w-full py-3.5 sm:py-4 rounded-full font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
              isComplete && !isVerifying
                ? 'bg-[#A2D5B1] hover:bg-[#91C8A1] active:scale-[0.99] text-slate-900 shadow-md cursor-pointer'
                : 'bg-[#F2F2F5] text-slate-400 cursor-not-allowed'
            }`}
          >
            {isVerifying ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                <span>Verifying...</span>
              </>
            ) : (
              <span>Next</span>
            )}
          </button>

          {/* Footer Resend Row */}
          <div className="flex items-center justify-between text-xs sm:text-sm pt-1 px-1">
            <span className="text-slate-400 font-medium">Didn't receive code?</span>
            <button
              type="button"
              disabled={isResendDisabled}
              onClick={handleResendCode}
              className={`font-bold transition-colors ${
                isResendDisabled
                  ? 'text-slate-600 cursor-default'
                  : 'text-slate-900 hover:underline cursor-pointer'
              }`}
            >
              {isResendDisabled ? `Resend in ${timer}s` : 'Resend Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
