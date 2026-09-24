// Tipos mínimos do Google Identity Services (https://accounts.google.com/gsi/client),
// só o que src/auth.ts usa do token client OAuth 2.
interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClientError {
  type: "popup_failed_to_open" | "popup_closed" | "unknown";
  message?: string;
}

interface GoogleTokenClient {
  requestAccessToken(overrides?: { prompt?: string }): void;
}

interface Window {
  google?: {
    accounts?: {
      oauth2?: {
        initTokenClient(config: {
          client_id: string;
          scope: string;
          callback: (response: GoogleTokenResponse) => void;
          error_callback?: (error: GoogleTokenClientError) => void;
        }): GoogleTokenClient;
      };
    };
  };
}
