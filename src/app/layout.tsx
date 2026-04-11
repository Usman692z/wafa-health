import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Wafa Health – Telemedicine Platform Pakistan',
  description:
    'Connect with certified doctors online. Book consultations, chat, video calls, and get e-prescriptions. Supporting JazzCash and Easypaisa.',
  keywords: ['telemedicine', 'Pakistan', 'doctor', 'online consultation', 'health', 'sehat'],
  authors: [{ name: 'Wafa Health' }],
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  openGraph: {
    title: 'Wafa Health – Telemedicine Pakistan',
    description: 'Online doctor consultations made simple.',
    type: 'website',
    locale: 'en_PK',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
