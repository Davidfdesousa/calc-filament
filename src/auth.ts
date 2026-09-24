import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export type { User };

export function watchAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// Popup funciona em qualquer domínio (ex.: Vercel) sem depender de cookies de terceiros.
// Redirect fica só como fallback quando o navegador bloqueia o popup.
export async function signInWithGoogle(): Promise<void> {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, googleProvider);
      return;
    }
    throw err;
  }
}

export async function checkRedirectResult(): Promise<void> {
  await getRedirectResult(auth);
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function authErrorMessage(err: unknown): string | undefined {
  const code = (err as { code?: string })?.code ?? "";
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    return undefined;
  }
  if (code === "auth/unauthorized-domain") {
    return "Este domínio não está autorizado no Firebase (Authentication → Settings → Authorized domains).";
  }
  return "Não foi possível entrar. Tente novamente.";
}
