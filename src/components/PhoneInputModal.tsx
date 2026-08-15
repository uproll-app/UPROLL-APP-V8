import React, { useState } from 'react';
import { ArrowLeft, X, Phone, ChevronDown } from 'lucide-react';
import { COUNTRY_CODES, CountryCode } from '../types';

interface PhoneInputModalProps {
  initialPhone?: string;
  onClose: () => void;
  onBack: () => void;
  onSubmitPhone: (fullPhone: string) => void;
}

export const PhoneInputModal: React.FC<PhoneInputModalProps> = ({
  initialPhone = '+91 8782468386',
  onClose,
  onBack,
  onSubmitPhone,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [phoneNumber, setPhoneNumber] = useState<string>('8782468386');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    const cleanNum = phoneNumber.replace(/\D/g, '');
    const full = `${selectedCountry.code} ${cleanNum}`;
    onSubmitPhone(full);
  };

  return (
    <div className="w-full flex flex-col items-center justify-end relative z-20">
      <div className="w-full bg-white text-slate-900 rounded-t-[32px] sm:rounded-t-[36px] rounded-b-[24px] p-5 sm:p-6 shadow-2xl transition-all duration-300 animate-slide-up border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-700 transition-all cursor-pointer focus:outline-none"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Enter Phone Number
          </h2>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-700 transition-all cursor-pointer focus:outline-none"
            aria-label="Close"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-xs sm:text-sm text-slate-500 font-medium text-center">
            We will send a 6-digit confirmation code to verify your mobile number.
          </p>

          <div className="relative">
            <div className="flex items-center gap-2 border border-slate-200 rounded-2xl p-1.5 focus-within:border-[#A2D5B1] focus-within:ring-2 focus-within:ring-[#A2D5B1]/20 bg-slate-50 transition-all">
              {/* Country Picker Trigger */}
              <button
                type="button"
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-sm hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span>{selectedCountry.flag}</span>
                <span>{selectedCountry.code}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Mobile number"
                className="w-full bg-transparent px-2 py-2 text-slate-900 font-bold text-lg focus:outline-none tracking-wide"
                autoFocus
              />
            </div>

            {/* Country Dropdown */}
            {isCountryDropdownOpen && (
              <div className="absolute top-14 left-0 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 overflow-hidden py-1">
                {COUNTRY_CODES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setSelectedCountry(c);
                      setIsCountryDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-semibold hover:bg-slate-100 text-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span>{c.flag}</span>
                      <span>{c.country}</span>
                    </span>
                    <span className="text-slate-400">{c.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!phoneNumber.trim()}
            className={`w-full py-3.5 sm:py-4 rounded-full font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
              phoneNumber.trim()
                ? 'bg-[#A2D5B1] hover:bg-[#91C8A1] active:scale-[0.99] text-slate-900 shadow-md cursor-pointer'
                : 'bg-[#F2F2F5] text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Send Code</span>
          </button>
        </form>
      </div>
    </div>
  );
};
