'use client'

import { ElementType, useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { cn } from '@/lib/utils'

type SplitTextProps = {
  tag?: 'h1' | 'h2' | 'p'
  text: string
  splitType?: 'words' | 'lines'
  delay?: number
  duration?: number
  ease?: string
  from?: gsap.TweenVars
  to?: gsap.TweenVars
  threshold?: number
  rootMargin?: string
  textAlign?: 'left' | 'center' | 'right'
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

export function SplitText({
  tag = 'h2',
  text,
  splitType = 'words',
  delay = 60,
  duration = 0.75,
  ease = 'power3.out',
  from = { opacity: 0, y: 28 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-40px',
  textAlign = 'left',
  className,
}: SplitTextProps) {
  const rootRef = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()
  const Tag = tag as ElementType
  const parts = useMemo(() => text.split(splitType === 'lines' ? /\s*\/\s*/ : ' '), [splitType, text])

  useEffect(() => {
    const root = rootRef.current
    if (!root || reducedMotion) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        gsap.fromTo(
          root.querySelectorAll('[data-split-part]'),
          from,
          { ...to, duration, ease, stagger: delay / 1000 },
        )
      },
      { threshold, rootMargin },
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [delay, duration, ease, from, reducedMotion, rootMargin, threshold, to])

  return (
    <Tag ref={rootRef} className={cn(className, textAlign === 'center' && 'text-center', textAlign === 'right' && 'text-right')}>
      {parts.map((part, index) => (
        <span
          key={`${part}-${index}`}
          data-split-part
          className={cn('inline-block will-change-transform', reducedMotion && 'will-change-auto')}
        >
          {part}
          {splitType === 'words' && index < parts.length - 1 ? '\u00a0' : null}
        </span>
      ))}
    </Tag>
  )
}
