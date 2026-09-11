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

// Google Identity Services must only be initialized ONCE per page load —
// re-initializing on every modal open spams the GSI console warning and can
// break the rendered button. The active callback is kept in a module pointer
// so a single initialization still always invokes the latest handlers.
let gsiInitializedFor: string | null = null;
let gsiActiveCallback: ((credential: string) => void) | null = null;

// Google silently refuses sign-in when the running origin is not registered
// as an Authorized JavaScript Origin on the OAuth client. Origins match
// exactly (scheme included!), so http://localhost:3000 and
// https://localhost:3000 are DIFFERENT entries in Google Cloud Console.
// We optimistically allow localhost dev origins — if the exact scheme is not
// registered, GSI's error_callback surfaces a precise fix-it message.
function isGoogleAuthAvailableOnThisOrigin(): boolean {
  try {
    const allowed = new URL(GOOGLE_CONFIG.appUrl).origin;
    if (window.location.origin === allowed) return true;
    const { hostname, protocol } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    return isLocal && (protocol === 'http:' || protocol === 'https:');
  } catch {
    return false;
  }
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [originBlocked] = useState<boolean>(() => !isGoogleAuthAvailableOnThisOrigin());

  useEffect(() => {
    if (!isOpen || originBlocked) return;

    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        try {
          gsiActiveCallback = (credential: string) => {
            const user = loginWithGoogleCredential(credential);
            onSuccess(user);
            onClose();
          };

          if (gsiInitializedFor !== GOOGLE_CONFIG.clientId) {
            window.google.accounts.id.initialize({
              client_id: GOOGLE_CONFIG.clientId,
              callback: (response: any) => {
                if (response?.credential && gsiActiveCallback) {
                  gsiActiveCallback(response.credential);
                } else {
                  console.warn('Google sign-in returned no credential.', response);
                }
              },
              // Surface real failures instead of failing silently
              error_callback: (err: any) => {
                console.warn('Google Identity error:', err?.type || err);
                if (err?.type === 'origin_mismatch') {
                  setErrorMsg(
                    `Google rejected this origin (${window.location.origin}). Origins match exactly — add "${window.location.origin}" in Google Cloud Console → APIs & Services → Credentials → Authorized JavaScript origins. Note http:// and https://localhost are separate entries.`,
                  );
                } else {
                  setErrorMsg('Google sign-in failed. Check the browser console for the GSI error type.');
                }
              },
            });
            gsiInitializedFor = GOOGLE_CONFIG.clientId;
          }

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
          setErrorMsg('Google Identity script failed to initialize in this browser.');
        }
      } else {
        setErrorMsg('Google Identity script did not load (offline or blocked). Use the local bridge below.');
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, originBlocked, onSuccess, onClose]);

  if (!isOpen) return null;

  const handleSimulatedSignIn = () => {
    const mockUser: UserProfile = {
      id: 'officer-commander-1',
      name: 'Dr. Karuna Sharma',
      email: 'commander@polarnav.com',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      role: 'Chief Ice Navigation Officer',
      loginTime: new Date().toISOString(),
      provider: 'local', // honest labeling: this is the offline dev bridge, not real OAuth
    };
    setCurrentUser(mockUser);
    onSuccess(mockUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-[rgba(196,219,255,0.28)] bg-[rgba(148,180,235,0.12)] backdrop-blur-2xl p-6 shadow-2xl text-[#f1f2fa]">
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

        {originBlocked && (
          <div className="p-3 mb-4 rounded-lg bg-[rgba(255,202,114,0.08)] border border-[rgba(255,202,114,0.3)] text-[11px] leading-relaxed">
            <div className="text-[#ffca72] font-semibold mb-1">
              ⚠ Google sign-in unavailable on this origin
            </div>
            <div className="text-[#b7bad0]">
              The OAuth client only allows <span className="font-mono text-[#c9c2ff]">{GOOGLE_CONFIG.appUrl}</span>.
              This app is running on <span className="font-mono text-[#ffca72]">{window.location.origin}</span>,
              which Google rejects silently. Add this origin in Google Cloud Console → APIs &amp; Services → Credentials →
              Authorized JavaScript origins to enable the official button — or use the local bridge below.
            </div>
          </div>
        )}

        {/* Google Official Button Container */}
        {!originBlocked && (
          <div className="flex flex-col items-center justify-center my-4 min-h-[44px]">
            <div id="google-official-btn" className="flex justify-center" />
          </div>
        )}

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
