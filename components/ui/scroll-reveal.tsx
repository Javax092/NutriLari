'use client'

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

type ScrollRevealProps = {
  text: string
  baseOpacity?: number
  enableBlur?: boolean
  baseRotation?: number
  blurStrength?: number
  className?: string
}

function subscribeToReducedMotion(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  mediaQuery.addEventListener('change', onStoreChange)

  return () => mediaQuery.removeEventListener('change', onStoreChange)
}

function getReducedMotionSnapshot() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getReducedMotionServerSnapshot() {
  return false
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeToReducedMotion, getReducedMotionSnapshot, getReducedMotionServerSnapshot)
}

export function ScrollReveal({
  text,
  baseOpacity = 0.22,
  enableBlur = true,
  baseRotation = 1,
  blurStrength = 2,
  className,
}: ScrollRevealProps) {
  const rootRef = useRef<HTMLHeadingElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const words = useMemo(() => text.split(' '), [text])
  const shouldReduceMotion = prefersReducedMotion

  useEffect(() => {
    const root = rootRef.current
    if (!root || shouldReduceMotion) return

    const context = gsap.context(() => {
      const wordEls = gsap.utils.toArray<HTMLElement>('[data-scroll-reveal-word]')

      gsap.fromTo(
        wordEls,
        {
          opacity: baseOpacity,
          rotate: baseRotation,
          filter: enableBlur ? `blur(${blurStrength}px)` : 'blur(0px)',
          y: 8,
        },
        {
          opacity: 1,
          rotate: 0,
          filter: 'blur(0px)',
          y: 0,
          ease: 'none',
          stagger: 0.055,
          scrollTrigger: {
            trigger: root,
            start: 'top 78%',
            end: 'bottom 44%',
            scrub: 0.45,
          },
        },
      )
    }, root)

    return () => context.revert()
  }, [baseOpacity, baseRotation, blurStrength, enableBlur, shouldReduceMotion])

  return (
    <h2 ref={rootRef} className={className}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          data-scroll-reveal-word
          className={cn('inline-block will-change-[opacity,filter,transform]', shouldReduceMotion && 'will-change-auto')}
        >
          {word}
          {index < words.length - 1 ? '\u00a0' : null}
        </span>
      ))}
    </h2>
  )
}
