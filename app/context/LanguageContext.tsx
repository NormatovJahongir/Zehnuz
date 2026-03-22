"use client";

import React, { createContext, useContext, useState } from 'react';

// Context yaratish
const LanguageContext = createContext<any>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Nomlarni layout va page fayllariga moslab 'currentLang' va 'setCurrentLang' qildik
  const [currentLang, setCurrentLang] = useState('UZ');

  return (
    <LanguageContext.Provider value={{ currentLang, setCurrentLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook yaratish
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage faqat LanguageProvider ichida ishlatilishi mumkin!");
  }
  return context;
};