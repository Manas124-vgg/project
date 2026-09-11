export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role: string;
  loginTime: string;
  provider: 'google' | 'local';
}

export const GOOGLE_CONFIG = {
  clientId:
    (typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID
      : undefined) ||
    '584069263560-mhuueak8neiv6t7hefmo6llo6u0gm47c.apps.googleusercontent.com',
  projectId:
    (typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_GOOGLE_PROJECT_ID || import.meta.env.GOOGLE_PROJECT_ID
      : undefined) || 'second-academy-508009-g1',
  appUrl:
    (typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_APP_URL || import.meta.env.APP_URL
      : undefined) || 'https://www.PolaNav.com',
  authUri: 'https://accounts.google.com/o/oauth2/auth',
  tokenUri: 'https://oauth2.googleapis.com/token',
};

const AUTH_STORAGE_KEY = 'polarnav_auth_user';
const listeners: Set<(user: UserProfile | null) => void> = new Set();

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed saving auth state:', err);
  }
  listeners.forEach((listener) => listener(user));
}

export function onAuthStateChanged(cb: (user: UserProfile | null) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function decodeGoogleJwt(credential: string): {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
} {
  try {
    const parts = credential.split('.');
    if (parts.length < 2) return {};
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to decode Google JWT:', err);
    return {};
  }
}

export function loginWithGoogleCredential(credential: string): UserProfile {
  const payload = decodeGoogleJwt(credential);
  const user: UserProfile = {
    id: payload.sub || ('google-' + Date.now()),
    name: payload.name || 'Polar Mission Officer',
    email: payload.email || 'officer@polarnav.com',
    picture: payload.picture,
    role: 'Lead Ice Navigator',
    loginTime: new Date().toISOString(),
    provider: 'google',
  };
  setCurrentUser(user);
  return user;
}

export function logout(): void {
  setCurrentUser(null);
}
