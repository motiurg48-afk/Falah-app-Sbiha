import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { LanguageProvider } from '@/lib/i18n';
import { CustomerAuthProvider } from '@/lib/customer-auth';
import ExitConfirmDialog from '@/components/ExitConfirmDialog';

const inter = Inter({ subsets: ['latin'] });

const OG_IMAGE =
  'https://images.pexels.com/photos/8526279/pexels-photo-8526279.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export const metadata: Metadata = {
  title: 'FALAH — Modest Islamic Apparel | Kolkata',
  description:
    'Premium modest Islamic apparel — abaya, borkha, khimar & hijab sets. Custom sizing, all-India delivery, wholesale orders. Based in Kolkata.',
  openGraph: {
    title: 'FALAH — Modest Islamic Apparel | Kolkata',
    description:
      'Premium abaya, borkha, khimar & hijab sets. Custom sizing, all-India delivery, wholesale orders.',
    type: 'website',
    images: [
      {
        url: OG_IMAGE,
        width: 940,
        height: 650,
        alt: 'FALAH — elegant modest apparel collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FALAH — Modest Islamic Apparel | Kolkata',
    description:
      'Premium abaya, borkha, khimar & hijab sets. Custom sizing, all-India delivery, wholesale orders.',
    images: [OG_IMAGE],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body className={inter.className}>
        <LanguageProvider>
          <CustomerAuthProvider>
            {children}
          </CustomerAuthProvider>
          <ExitConfirmDialog />
        </LanguageProvider>
      </body>
    </html>
  );
}
