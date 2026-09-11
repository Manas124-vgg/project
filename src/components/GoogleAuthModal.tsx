import React, { useEffect, useState } from 'react';
import { GOOGLE_CONFIG, loginWithGoogleCredential, setCurrentUser, UserProfile } from '../services/authService';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CONFIG.clientId,
            callback: (response: any) => {
              if (response?.credential) {
                const user = loginWithGoogleCredential(response.credential);
                onSuccess(user);
                onClose();
              } else {
                setErrorMsg('No credential returned by Google.');
              }
            },
          });

          const btnElem = document.getElementById('google-official-btn');
          if (btnElem) {
            btnElem.innerHTML = '';
            window.google.accounts.id.renderButton(btnElem, {
              theme: 'filled_black',
              size: 'large',
              shape: 'pill',
              text: 'signin_with',
              width: 280,
            });
          }
        } catch (err: any) {
          console.warn('Google GSI init notice:', err);
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, onSuccess, onClose]);

  if (!isOpen) return null;

  const handleSimulatedSignIn = () => {
    const mockUser: UserProfile = {
      id: 'officer-commander-1',
      name: 'Dr. Karuna Sharma',
      email: 'commander@polarnav.com',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      role: 'Chief Ice Navigation Officer',
      loginTime: new Date().toISOString(),
      provider: 'google',
    };
    setCurrentUser(mockUser);
    onSuccess(mockUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-[rgba(165,177,224,0.25)] bg-[#0d1020] p-6 shadow-2xl text-[#f1f2fa]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9297b1] hover:text-white transition-colors cursor-pointer text-lg"
          aria-label="Close dialog"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#45e0d0] to-[#8b7cff] flex items-center justify-center text-black font-bold font-space shadow-md">
            ❄
          </div>
          <div>
            <h3 className="text-lg font-space font-bold tracking-tight text-white">
              PolarNav Commander Sign-In
            </h3>
            <p className="text-xs text-[#9297b1]">
              Authenticate via Google Cloud Identity (OAuth 2.0)
            </p>
          </div>
        </div>

        {/* Project Cloud Info Box */}
        <div className="rounded-xl border border-[rgba(165,177,224,0.12)] bg-[rgba(22,27,54,0.6)] p-3.5 mb-5 space-y-2 text-xs">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[#9297b1]">Google Cloud Project:</span>
            <span className="font-mono text-[#45e0d0] font-medium">{GOOGLE_CONFIG.projectId}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[#9297b1]">Authorized Origin:</span>
            <span className="font-mono text-[#c9c2ff]">{GOOGLE_CONFIG.appUrl}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[#9297b1]">Client ID:</span>
            <span className="font-mono text-[#b7bad0] text-[10px] truncate max-w-[200px]" title={GOOGLE_CONFIG.clientId}>
              {GOOGLE_CONFIG.clientId.slice(0, 24)}...
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 mb-4 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Google Official Button Container */}
        <div className="flex flex-col items-center justify-center my-4 min-h-[44px]">
          <div id="google-official-btn" className="flex justify-center" />
        </div>

        {/* Local/Dev Fallback */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[rgba(165,177,224,0.15)]"></div>
          <span className="flex-shrink mx-3 text-[10px] uppercase font-mono tracking-wider text-[#666b86]">
            Dev / Offline Auth
          </span>
          <div className="flex-grow border-t border-[rgba(165,177,224,0.15)]"></div>
        </div>

        <button
          onClick={handleSimulatedSignIn}
          className="w-full mt-3 py-2.5 px-4 rounded-xl border border-[rgba(69,224,208,0.35)] bg-[rgba(69,224,208,0.1)] hover:bg-[rgba(69,224,208,0.18)] text-[#45e0d0] text-xs font-semibold font-space tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>⚓</span>
          <span>Sign In as Chief Navigation Officer (Local Bridge)</span>
        </button>

        <p className="text-[10px] text-[#666b86] text-center mt-4">
          Secured with Google Cloud OAuth 2.0 & PolarNav Antarctic Mission Gateway.
        </p>
      </div>
    </div>
  );
};
