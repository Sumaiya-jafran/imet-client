'use client';
import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { Language } from '@/types/translation';
const storageKey = 'imet-content-language';
let memoryLanguage: Language = 'en';
function snapshot(): Language {
  try {
    const value = localStorage.getItem(storageKey);
    if (value === 'en' || value === 'bn' || value === 'zh') return value;
  } catch {
    /* Browser storage may be disabled. */
  }
  return memoryLanguage;
}
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('imet-language', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('imet-language', callback);
  };
}
interface LanguagePreference {
  language: Language;
  setLanguage: (language: Language) => void;
  originals: boolean;
  setOriginals: (value: boolean) => void;
}
const Context = createContext<LanguagePreference | null>(null);
export default function LanguageContext({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(
    subscribe,
    snapshot,
    () => 'en' as const,
  );
  const [originals, setOriginals] = useState(false);
  const setLanguage = (value: Language) => {
    memoryLanguage = value;
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      /* Keep the in-memory preference. */
    }
    window.dispatchEvent(new Event('imet-language'));
    setOriginals(false);
  };
  return (
    <Context.Provider
      value={{ language, setLanguage, originals, setOriginals }}
    >
      {children}
    </Context.Provider>
  );
}
export function useLanguage() {
  const value = useContext(Context);
  if (!value) throw new Error('LanguageContext is required');
  return value;
}
