import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Agentic Video Automator',
  description: 'Create, schedule, and auto-publish Instagram videos.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen`}>
        <Toaster position="top-right" />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
