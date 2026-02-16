import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import './globals.css';
import AnimatedBackground from '@/components/AnimatedBackground';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Toaster } from 'react-hot-toast';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://trendovahub.com'),
  title: {
    default: 'Trendova Hub - Stock Market Analysis',
    template: '%s - Trendova Hub',
  },
  description: 'Trendova Hub delivers institutional-grade stock analysis and market insights for Indian NSE stocks.',
  keywords: [
    'Trendova Hub',
    'stock analysis',
    'NSE',
    'fundamental analysis',
    'market insights',
    'Indian stocks',
  ],
  openGraph: {
    title: 'Trendova Hub - Stock Market Analysis',
    description: 'Trendova Hub delivers institutional-grade stock analysis and market insights for Indian NSE stocks.',
    siteName: 'Trendova Hub',
    url: 'https://trendovahub.com',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trendova Hub - Stock Market Analysis',
    description: 'Trendova Hub delivers institutional-grade stock analysis and market insights for Indian NSE stocks.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} antialiased font-sans`}>
        <AnimatedBackground />
        <Toaster position="top-right" />
        <Header />
        <main className="relative pt-16 md:pt-20 safe-min-h-screen overflow-x-clip">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
