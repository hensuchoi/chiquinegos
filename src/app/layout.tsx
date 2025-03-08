// This is a server component by default (no 'use client' directive)
import './globals.css';
import { Inter, Outfit } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });
const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata = {
  title: 'Servicios Locales',
  description: 'Encuentra servicios y negocios locales de confianza',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.className} ${outfit.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
