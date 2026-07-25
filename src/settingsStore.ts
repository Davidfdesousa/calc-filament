import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface UserSettings {
  precoKg: number | null;
  potenciaW: number | null;
  tarifaKwh: number | null;
  falhaPct: number | null;
  roiPct: number | null;
}

export const emptySettings: UserSettings = {
  precoKg: null,
  potenciaW: null,
  tarifaKwh: null,
  falhaPct: null,
  roiPct: null,
};

function settingsDoc(uid: string) {
  return doc(db, "users", uid, "config", "settings");
}

export async function loadSettings(uid: string): Promise<UserSettings> {
  const snap = await getDoc(settingsDoc(uid));
  if (!snap.exists()) return { ...emptySettings };
  return { ...emptySettings, ...(snap.data() as Partial<UserSettings>) };
}

export async function saveSettings(uid: string, settings: UserSettings): Promise<void> {
  await setDoc(settingsDoc(uid), settings, { merge: true });
}
