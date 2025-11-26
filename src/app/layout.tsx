import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Buconnect - Alumni & Student Network',
  description: 'A minimal and sleek platform for alumni and students to connect, collaborate, and build networks.',
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    apple: '/logo.svg',
    shortcut: '/logo.svg',
  },
  other: {
    'msapplication-TileImage': '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable}`}>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
