'use client'
import { useEffect } from 'react'

/**
 * DesignEffects — mounts once in layout, no UI output
 *
 * 1. Scroll-reveal: IntersectionObserver adds .revealed to .reveal / .reveal-scale / .reveal-3d
 * 2. Spotlight: tracks mouse on .spotlight elements → updates --mx/--my CSS vars
 * 3. Magnetic card tilt: subtle 3D tilt on hover for .card-tilt elements
 * 4. Parallax: scroll → translateY on .parallax-slow/medium/fast
 * 5. Count-up: animates .count-up[data-target] numbers when revealed
 */
export default function DesignEffects() {
  useEffect(() => {
    // ── 1. Scroll-reveal ──────────────────────────────
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
            // Trigger count-up if applicable
            const el = entry.target as HTMLElement
            if (el.classList.contains('count-up') && el.dataset.target) {
              animateCount(el, parseInt(el.dataset.target, 10))
            }
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    const attach = () => {
      document.querySelectorAll('.reveal, .reveal-scale, .reveal-3d, .count-up').forEach(el => {
        observer.observe(el)
      })
    }
    attach()

    const mutObs = new MutationObserver(attach)
    mutObs.observe(document.body, { childList: true, subtree: true })

    // ── 2. Spotlight cursor glow ──────────────────────
    const handleMouseMove = (e: MouseEvent) => {
      document.querySelectorAll<HTMLElement>('.spotlight').forEach(el => {
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
      const el = e.currentTarget as HTMLElement
      const rect = el.getBoundingClientRect()
      const dx = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2)
      const dy = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2)
      el.style.transform = `perspective(600px) rotateX(${-dy * 3}deg) rotateY(${dx * 3}deg) translateY(-2px)`
      el.style.transition = 'transform 0.1s ease'
    }
    const tiltLeave = (e: MouseEvent) => {
      const el = e.currentTarget as HTMLElement
      el.style.transform = ''
      el.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)'
    }
    const tiltMove = (e: MouseEvent) => {
      const el = e.currentTarget as HTMLElement
      const rect = el.getBoundingClientRect()
      const dx = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2)
      const dy = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2)
      el.style.transform = `perspective(600px) rotateX(${-dy * 4}deg) rotateY(${dx * 4}deg) translateY(-2px)`
    }
    const attachTilt = () => {
      document.querySelectorAll<HTMLElement>('.card-tilt').forEach(el => {
        el.removeEventListener('mouseenter', tiltEnter)
        el.removeEventListener('mousemove',  tiltMove)
        el.removeEventListener('mouseleave', tiltLeave)
        el.addEventListener('mouseenter', tiltEnter)
        el.addEventListener('mousemove',  tiltMove)
        el.addEventListener('mouseleave', tiltLeave)
      })
    }
    attachTilt()
    const tiltMutObs = new MutationObserver(attachTilt)
    tiltMutObs.observe(document.body, { childList: true, subtree: true })

    // ── 4. Parallax scroll depth ──────────────────────
    let rafId = 0
    const handleScroll = () => {
      const sy = window.scrollY
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        document.querySelectorAll<HTMLElement>('.parallax-slow, .parallax-medium, .parallax-fast').forEach(el => {
          const speed = el.classList.contains('parallax-fast') ? 0.25
                      : el.classList.contains('parallax-medium') ? 0.15
                      : 0.08
          el.style.transform = `translateY(${-sy * speed}px)`
        })
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // ── 5. Count-up animation ─────────────────────────
    function animateCount(el: HTMLElement, target: number) {
      const duration = 1800
      const start = performance.now()
      const suffix = el.dataset.suffix || ''
      const prefix = el.dataset.prefix || ''
      const frame = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
        const value = Math.round(target * eased)
        el.textContent = `${prefix}${value.toLocaleString()}${suffix}`
        if (progress < 1) requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    }

    return () => {
      observer.disconnect()
      mutObs.disconnect()
      tiltMutObs.disconnect()
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return null
}
