import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export type { User };

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function watchAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// O login do Google é feito pelo Google Identity Services (script em index.html), e o token
// é entregue ao Firebase via signInWithCredential. Isso evita a página /__/auth/handler do
// Firebase, que depende de sessionStorage e quebra no iPhone (WebKit particiona o storage):
// "Unable to process request due to missing initial state".
// Precisa ser chamada de forma síncrona dentro do clique, senão o navegador bloqueia o popup.
export function signInWithGoogle(): Promise<void> {
  const oauth2 = window.google?.accounts?.oauth2;
  if (!GOOGLE_CLIENT_ID || !oauth2) {
    // Script do Google não carregou (bloqueador, rede) — tenta o popup do próprio Firebase.
    return signInWithPopup(auth, googleProvider).then(() => undefined);
  }

  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(authError(`gis/${response.error ?? "no-token"}`, response.error_description));
          return;
        }
        const credential = GoogleAuthProvider.credential(null, response.access_token);
        signInWithCredential(auth, credential).then(() => resolve(), reject);
      },
      error_callback: (error) => reject(authError(`gis/${error.type}`, error.message)),
    });
    client.requestAccessToken();
  });
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

function authError(code: string, message?: string): Error {
  return Object.assign(new Error(message ?? code), { code });
}

export function authErrorMessage(err: unknown): string | undefined {
  const code = (err as { code?: string })?.code ?? "";
  if (
    code === "gis/popup_closed" ||
    code === "gis/access_denied" ||
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request"
  ) {
    return undefined;
  }
  if (code === "gis/popup_failed_to_open" || code === "auth/popup-blocked") {
    return "O navegador bloqueou a janela de login. Permita pop-ups para este site e tente novamente.";
  }
  if (code === "auth/unauthorized-domain") {
    return "Este domínio não está autorizado no Firebase (Authentication → Settings → Authorized domains).";
  }
  return "Não foi possível entrar. Tente novamente.";
}
