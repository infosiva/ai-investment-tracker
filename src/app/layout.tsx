import type { Metadata } from 'next'
import './globals.css'
import SharedNavbar from '@/components/SharedNavbar'
import SharedFooter from '@/components/SharedFooter'
import type { BrandConfig } from '@/components/SharedNavbar'

export const brand: BrandConfig = {
  name: 'WealthPilot',
  tagline: 'AI-powered investment portfolio tracker with real-time insights and alerts.',
  icon: '📈',
  color: '#22c55e',
  url: 'https://wealthpilot.app',
  navLinks: [{ label: 'Track portfolio', href: '/' }, { label: 'Alerts', href: '/?tab=alerts' }],
  cta: { label: 'Track free →', href: '/' },
}

export const metadata: Metadata = {
  title: 'WealthPilot — AI Investment Portfolio Tracker',
  description: 'Track and optimise your investment portfolio with AI-powered insights, real-time quotes and smart alerts.',
  keywords: ['investment tracker', 'portfolio tracker', 'AI finance', 'stock portfolio', 'wealth management'],
  openGraph: { title: 'WealthPilot — AI Portfolio Tracker', description: 'AI investment portfolio tracker with smart alerts.', type: 'website', locale: 'en_GB', siteName: 'WealthPilot' },
  twitter: { card: 'summary_large_image', title: 'WealthPilot', description: 'AI investment portfolio tracker.' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "SoftwareApplication",
          "name": "WealthPilot", "url": brand.url, "description": brand.tagline,
          "applicationCategory": "FinanceApplication", "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "GBP" }
        })}} />
      </head>
      <body className="flex flex-col min-h-screen">
        <SharedNavbar brand={brand} />
        <main className="flex-1 pt-16">{children}</main>
        <SharedFooter brand={brand} />
        <script src="http://31.97.56.148:3098/t.js" data-site="ai-investment-tracker-delta.vercel.app" defer></script>
      </body>
    </html>
  )
}
