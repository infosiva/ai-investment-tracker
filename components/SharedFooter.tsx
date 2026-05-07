import Link from 'next/link'
import { BrandConfig } from './SharedNavbar'

export default function SharedFooter({ brand }: { brand: BrandConfig }) {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-white/[0.05] bg-[#07060f] mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">{brand.icon}</span>
              <span className="font-bold text-white text-sm">{brand.name}</span>
            </div>
            <p className="text-white/40 text-xs max-w-xs">{brand.tagline}</p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-white/40">
            <Link href="/privacy" className="hover:text-white/70 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white/70 transition-colors">Terms</Link>
            {brand.navLinks?.map(l => (
              <Link key={l.href} href={l.href} className="hover:text-white/70 transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <span>© {year} {brand.name}. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Built with AI
          </span>
        </div>
      </div>
    </footer>
  )
}
