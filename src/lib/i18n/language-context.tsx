'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getLocalizedTool } from './tool-translations';
import { LanguageCode, TranslationVars, languages, translateKey, translateVisibleText, translations } from './translations';

const STORAGE_KEY = 'ajn-language';

interface LanguageContextType {
  language: LanguageCode;
  languages: typeof languages;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, vars?: TranslationVars) => string;
  text: (value: string) => string;
  tool: (id: string, fallbackName: string, fallbackDesc: string, fallbackKeywords?: string[]) => { name: string; desc: string; aliases: string[] };
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    let frameOne = 0;
    let frameTwo = 0;
    let cancelled = false;

    const applyInitialLanguage = () => {
      if (cancelled) return;

      const saved = window.localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      const browser = window.navigator.language.split('-')[0] as LanguageCode;
      const target = saved && translations[saved] ? saved : translations[browser] ? browser : 'en';

      if (cancelled) return;

      setLanguageState(target);
      document.documentElement.lang = target;
      document.documentElement.dataset.language = target;
    };

    const scheduleInitialLanguage = () => {
      frameOne = window.requestAnimationFrame(() => {
        frameTwo = window.requestAnimationFrame(() => {
          applyInitialLanguage();
        });
      });
    };

    if (document.readyState === 'complete') {
      scheduleInitialLanguage();
    } else {
      window.addEventListener('load', scheduleInitialLanguage, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('load', scheduleInitialLanguage);

      if (frameOne) window.cancelAnimationFrame(frameOne);
      if (frameTwo) window.cancelAnimationFrame(frameTwo);
    };
  }, []);

  const setLanguage = useCallback((lang: LanguageCode) => {
    if (!translations[lang]) return;
    setLanguageState(lang);
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dataset.language = lang;
    window.dispatchEvent(new CustomEvent('ajn-language-changed', { detail: { language: lang } }));
  }, []);

  const t = useCallback((key: string, vars?: TranslationVars) => translateKey(language, key, vars), [language]);
  const text = useCallback((value: string) => translateVisibleText(language, value), [language]);
  const tool = useCallback((id: string, fallbackName: string, fallbackDesc: string, fallbackKeywords: string[] = []) => getLocalizedTool(language, id, fallbackName, fallbackDesc, fallbackKeywords), [language]);

  const value = useMemo(() => ({ language, languages, setLanguage, t, text, tool }), [language, setLanguage, t, text, tool]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
