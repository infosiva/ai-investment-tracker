import type { Metadata } from 'next'
import './globals.css'
import SharedNavbar from '@/components/SharedNavbar'
import Footer from '../../components/Footer'
import DesignEffects from '@/components/DesignEffects'
import AnimatedBackground from '@/components/AnimatedBackground'
import ChatBot from '@/components/ChatBot'
import type { BrandConfig } from '@/components/SharedNavbar'
import CookieConsent from "../../components/CookieConsent";

const brand: BrandConfig = {
  name: 'TrackWealth',
  tagline: 'AI-powered investment portfolio tracker with real-time insights and alerts.',
  icon: '📈',
  color: '#22c55e',
  url: 'https://trackwealth.app',
  navLinks: [{ label: 'Track portfolio', href: '/' }, { label: 'Alerts', href: '/?tab=alerts' }],
  cta: { label: 'Track free →', href: '/' },
}

export const metadata: Metadata = {
  title: 'TrackWealth — AI Investment Portfolio Tracker',
  description: 'Track and optimise your investment portfolio with AI-powered insights, real-time quotes and smart alerts.',
  keywords: ['investment tracker', 'portfolio tracker', 'AI finance', 'stock portfolio', 'wealth management'],
  openGraph: { title: 'TrackWealth — AI Portfolio Tracker', description: 'AI investment portfolio tracker with smart alerts.', type: 'website', locale: 'en_GB', siteName: 'TrackWealth' },
  twitter: { card: 'summary_large_image', title: 'TrackWealth', description: 'AI investment portfolio tracker.' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "SoftwareApplication",
          "name": "TrackWealth", "url": brand.url, "description": brand.tagline,
          "applicationCategory": "FinanceApplication", "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "GBP" }
        })}} />
      </head>
      <body className="flex flex-col min-h-screen">
        <AnimatedBackground />
        <DesignEffects />
        <SharedNavbar brand={brand} />
        <main className="flex-1 pt-16">{children}</main>
        <Footer siteName="TrackWealth" />
        <ChatBot />
      <CookieConsent />
      </body>
    </html>
  )
}
