import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AnimatedBackground from '@/components/AnimatedBackground';
import { Header } from '@/components/Header';
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Stock Analysis Platform | Indian NSE Stocks',
  description: 'Educational stock analysis platform providing institutional-grade fundamental insights for Indian NSE stocks.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AnimatedBackground />
        <Toaster position="top-right" />
        <Header />
        <main className="relative pt-20 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
