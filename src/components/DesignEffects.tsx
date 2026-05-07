'use client'
import { useEffect } from 'react'

/**
 * DesignEffects — mounts once in layout, no UI output
 *
 * 1. Scroll-reveal: IntersectionObserver adds .revealed to .reveal / .reveal-scale
 * 2. Spotlight: tracks mouse on .spotlight elements → updates --mx/--my CSS vars
 * 3. Card magnetic tilt: subtle 3D tilt on hover for .card-tilt elements
 */
export default function DesignEffects() {
  useEffect(() => {
    // ── 1. Scroll-reveal ──────────────────────────────
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            // once revealed, stop watching
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    const attach = () => {
      document.querySelectorAll('.reveal, .reveal-scale').forEach(el => {
        observer.observe(el)
      })
    }
    attach()

    // Re-attach on dynamic content (e.g. after route changes)
    const mutObs = new MutationObserver(attach)
    mutObs.observe(document.body, { childList: true, subtree: true })

    // ── 2. Spotlight cursor glow ──────────────────────
    const handleMouseMove = (e: MouseEvent) => {
      const spotlights = document.querySelectorAll<HTMLElement>('.spotlight')
      spotlights.forEach(el => {
        const rect = el.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1)
        const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1)
        el.style.setProperty('--mx', `${x}%`)
        el.style.setProperty('--my', `${y}%`)
      })
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    // ── 3. Magnetic card tilt ─────────────────────────
    const tiltEnter = (e: MouseEvent) => {
      const el = (e.currentTarget as HTMLElement)
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width  / 2
      const cy = rect.top  + rect.height / 2
      const dx = (e.clientX - cx) / (rect.width  / 2)
      const dy = (e.clientY - cy) / (rect.height / 2)
      el.style.transform = `perspective(600px) rotateX(${-dy * 3}deg) rotateY(${dx * 3}deg) translateY(-2px)`
      el.style.transition = 'transform 0.1s ease'
    }
    const tiltLeave = (e: MouseEvent) => {
      const el = (e.currentTarget as HTMLElement)
      el.style.transform = ''
      el.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)'
    }
    const tiltMove = (e: MouseEvent) => {
      const el = (e.currentTarget as HTMLElement)
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width  / 2
      const cy = rect.top  + rect.height / 2
      const dx = (e.clientX - cx) / (rect.width  / 2)
      const dy = (e.clientY - cy) / (rect.height / 2)
      el.style.transform = `perspective(600px) rotateX(${-dy * 4}deg) rotateY(${dx * 4}deg) translateY(-2px)`
    }

    const attachTilt = () => {
      document.querySelectorAll<HTMLElement>('.card-tilt').forEach(el => {
        el.addEventListener('mouseenter', tiltEnter)
        el.addEventListener('mousemove',  tiltMove)
        el.addEventListener('mouseleave', tiltLeave)
      })
    }
    attachTilt()
    const tiltMutObs = new MutationObserver(attachTilt)
    tiltMutObs.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutObs.disconnect()
      tiltMutObs.disconnect()
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return null
}
