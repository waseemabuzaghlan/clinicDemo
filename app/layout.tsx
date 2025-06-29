import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-inter',
  fallback: ['system-ui', 'arial', 'sans-serif'],
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'Bioclinic - Clinic Management System',
  description: 'Modern clinic management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}