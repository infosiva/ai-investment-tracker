import Link from 'next/link'
import { BrandConfig } from './SharedNavbar'

export default function SharedFooter({ brand }: { brand: BrandConfig }) {
  const year = new Date().getFullYear()
  const links = brand.navLinks ?? []

  return (
    <footer className="mt-auto border-t border-white/[0.04]">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 group select-none">
            <span className="text-base transition-transform duration-200 group-hover:scale-110" aria-hidden>
              {brand.icon}
            </span>
            <span className="text-sm font-medium text-white/50 group-hover:text-white/70 transition-colors">
              {brand.name}
            </span>
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/30">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="hover:text-white/60 transition-colors duration-150"
              >
                {l.label}
              </Link>
            ))}
            <Link href="/privacy" className="hover:text-white/60 transition-colors duration-150">Privacy</Link>
            <Link href="/terms" className="hover:text-white/60 transition-colors duration-150">Terms</Link>
          </nav>
        </div>

        <div className="mt-6 flex items-center justify-between text-[12px] text-white/20">
          <span>© {year} {brand.name}</span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: brand.color }}
            />
            AI-powered
          </span>
        </div>
      </div>
    </footer>
  )
}
