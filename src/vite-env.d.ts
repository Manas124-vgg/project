/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly APP_URL?: string;
  readonly VITE_APP_URL?: string;
  readonly GOOGLE_CLIENT_ID?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly GOOGLE_PROJECT_ID?: string;
  readonly VITE_GOOGLE_PROJECT_ID?: string;
  readonly GOOGLE_AUTH_URI?: string;
  readonly GOOGLE_TOKEN_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
