import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata = {
  title: 'NEON PORTAL - Ultimate Gaming Experience',
  description: 'Your gateway to the ultimate gaming experience. Discover and play the best tactical FPS, social chaos, stealth action, and sci-fi combat games.',
  keywords: ['gaming', 'games', 'neon portal', 'FPS', 'bingo', 'action', 'sci-fi', 'online games'],
  authors: [{ name: 'Game Hub' }],
  creator: 'Game Hub',
  publisher: 'Game Hub',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    title: 'NEON PORTAL - Ultimate Gaming Experience',
    description: 'Your gateway to the ultimate gaming experience. Play NET FLEX, BINGO FIESTA, PHANTOM, and TEKHEN.',
    siteName: 'NEON PORTAL',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NEON PORTAL Gaming Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NEON PORTAL - Ultimate Gaming Experience',
    description: 'Your gateway to the ultimate gaming experience. Play NET FLEX, BINGO FIESTA, PHANTOM, and TEKHEN.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
