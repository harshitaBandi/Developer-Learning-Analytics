import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VibecoderZ | Developer Upskilling Platform',
  description: 'Track your learning velocity, visualize skill relationships, and accelerate your developer journey with data-driven insights.',
  keywords: ['developer', 'upskilling', 'learning', 'skills', 'knowledge graph', 'LVI'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased bg-surface-950 text-white`}>
        {children}
      </body>
    </html>
  );
}

