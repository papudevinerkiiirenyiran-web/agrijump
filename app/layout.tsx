import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import './globals.css';
import { EventsProvider } from '@/lib/store';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import { themeInitScript } from '@/lib/theme';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const body = Figtree({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AgriJump — Find your next drop on campus',
  description:
    'Find drops around the Agripolis campus and jump in. Frisbee, coffee, open mic, film walks.',
  manifest: '/manifest.webmanifest',
  applicationName: 'AgriJump',
  appleWebApp: {
    capable: true,
    title: 'AgriJump',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F2E9' },
    { media: '(prefers-color-scheme: dark)', color: '#111209' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body className={`${display.variable} ${body.variable} film-grain`}>
        {/* App Shell: full width on mobile, collapsed to a 480px phone column on desktop */}
        <div className="relative mx-auto min-h-[100dvh] w-full max-w-[480px] bg-paper-100 shadow-soft-lg dark:bg-ink-900 sm:border-x sm:border-black/5 dark:sm:border-white/[0.06]">
          <EventsProvider>{children}</EventsProvider>
        </div>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
