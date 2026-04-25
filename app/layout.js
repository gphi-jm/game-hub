import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata = {
  title: 'Game Library - Tactical Interface',
  description: 'A Valorant-inspired game library with chevron cards, gold active states, and a pine-green HUD.',
  keywords: ['gaming', 'game library', 'tactical ui', 'valorant-inspired', 'fps', 'action'],
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
    title: 'Game Library - Tactical Interface',
    description: 'High-performance game cards, a fixed HUD, and a Baguio Pine / Victory Gold palette.',
    siteName: 'Game Hub',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Game Library tactical interface',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Game Library - Tactical Interface',
    description: 'High-performance game cards, a fixed HUD, and a Baguio Pine / Victory Gold palette.',
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
