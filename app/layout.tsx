"use client";

import { Inter } from "next/font/google";
import "./globals.css"; 
import Link from "next/link";
import Script from "next/script";
import { usePathname } from 'next/navigation';
import React from 'react';
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { 
  GraduationCap, Home, MapPinned, LogIn,
  Phone, Mail, Send, Instagram, Facebook  
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

// Navigatsiya alohida komponent sifatida
function Navbar() {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/center/');
  const { currentLang, setCurrentLang } = useLanguage();

  if (isAdminPage) return null;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-[100] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-blue-600 p-2.5 rounded-xl group-hover:rotate-6 transition-transform shadow-lg shadow-blue-200">
              <GraduationCap className="text-white" size={26} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-gray-900 leading-none">Zehn.uz</span>
              <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Platformasi</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 font-bold text-gray-500">
            <Link href="/" className="hover:text-blue-600 transition flex items-center gap-2">
              <Home size={18} /> Marketplace
            </Link>
            <a href="#map-section" className="hover:text-blue-600 transition flex items-center gap-2">
              <MapPinned size={18} /> Xarita
            </a>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-gray-100 p-1 rounded-xl flex gap-1 border border-gray-200">
              {['UZ', 'RU', 'EN'].map((l) => (
                <button 
                  key={l}
                  onClick={() => setCurrentLang(l)}
                  className={`text-[11px] font-black px-3 py-1.5 rounded-lg transition-all ${currentLang === l ? 'bg-white shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <Link href="/login" className="bg-slate-900 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-600 transition font-bold shadow-lg active:scale-95">
              <LogIn size={18} /> Kirish
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// 1. Footer komponentini shu yerning o'zida yaratib qo'yamiz
function Footer() {
  const { currentLang } = useLanguage();
  const year = new Date().getFullYear();
  
  const text = {
    UZ: "Barcha huquqlar himoyalangan",
    RU: "Все права защищены",
    EN: "All rights reserved"
  };

  return (
    <footer className="py-10 border-t text-center text-gray-500 text-sm">
      © {year} Zehn.uz {text[currentLang as keyof typeof text]}
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50 text-gray-900 antialiased`}>
        <LanguageProvider>
   <Navbar />      {/* Tilni o'zgartira oladi */}
   <main>{children}</main> {/* Tilni qabul qila oladi */}
   <Footer />      {/* Tilga qarab o'zgaradi */}
</LanguageProvider>
      </body>
    </html>
  );
}
