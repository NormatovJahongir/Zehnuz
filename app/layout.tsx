import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Zehn.uz — O'quv markazlari platformasi",
  description: "O'quv markazlari uchun zamonaviy boshqaruv tizimi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
