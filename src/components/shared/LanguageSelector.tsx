'use client';
import { useId } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { languages, type Language } from '@/types/translation';
export default function LanguageSelector() {
  const id = useId();
  const { language, setLanguage, originals, setOriginals } = useLanguage();
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
      <label htmlFor={id} className="sr-only">
        Marketplace content language
      </label>
      <select
        id={id}
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="max-w-32 py-2"
        title="Marketplace content language; original text is used when unavailable"
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code} lang={l.code}>
            {l.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        aria-pressed={originals}
        onClick={() => setOriginals(!originals)}
        className="min-h-9 rounded border border-slate-200 px-2 py-1 font-medium text-slate-600 hover:bg-slate-50"
      >
        {originals ? 'Show translations' : 'Show originals'}
      </button>
      <span className="sr-only" role="status">
        {originals
          ? 'Showing original marketplace text.'
          : 'Showing available translations. Original text is used when unavailable.'}{' '}
        Interface labels remain in English.
      </span>
    </div>
  );
}
