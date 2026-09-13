'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { cn } from '@/lib/utils'

type AnimatedContentProps = {
  children: ReactNode
  distance?: number
  direction?: 'vertical' | 'horizontal'
  duration?: number
  ease?: string
  initialOpacity?: number
  animateOpacity?: boolean
  scale?: number
  threshold?: number
  delay?: number
  className?: string
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reduced
}

export function AnimatedContent({
  children,
  distance = 32,
  direction = 'vertical',
  duration = 0.75,
  ease = 'power3.out',
  initialOpacity = 0,
  animateOpacity = true,
  scale = 0.98,
  threshold = 0.15,
  delay = 0,
  className,
}: AnimatedContentProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const root = rootRef.current
    if (!root || reducedMotion) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        gsap.fromTo(
          root,
          {
            opacity: animateOpacity ? initialOpacity : 1,
            x: direction === 'horizontal' ? distance : 0,
            y: direction === 'vertical' ? distance : 0,
            scale,
          },
          { opacity: 1, x: 0, y: 0, scale: 1, duration, delay, ease },
        )
      },
      { threshold },
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [animateOpacity, delay, direction, distance, duration, ease, initialOpacity, reducedMotion, scale, threshold])

  return (
    <div ref={rootRef} className={cn('will-change-transform', reducedMotion && 'will-change-auto', className)}>
      {children}
    </div>
  )
}
