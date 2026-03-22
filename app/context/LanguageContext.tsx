"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext<any>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLang, setCurrentLang] = useState('UZ');

  // Tanlangan tilni brauzer xotirasida saqlash (ixtiyoriy)
  useEffect(() => {
    const savedLang = localStorage.getItem('lang');
    if (savedLang) setCurrentLang(savedLang);
  }, []);

  const changeLang = (lang: string) => {
    setCurrentLang(lang);
    localStorage.setItem('lang', lang);
  };

  return (
    <LanguageContext.Provider value={{ currentLang, setCurrentLang: changeLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  // Agar context topilmasa, build xatosi bermaslik uchun default qiymat qaytaramiz
  if (!context) {
    return { currentLang: 'UZ', setCurrentLang: () => {} };
  }
  return context;
};
