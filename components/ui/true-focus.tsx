'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

type FocusRect = {
  left: number
  top: number
  width: number
  height: number
}

type TrueFocusProps = {
  segments: readonly string[]
  label: string
  accentIndexes?: readonly number[]
  manualMode?: boolean
  blurAmount?: number
  animationDuration?: number
  pauseBetweenAnimations?: number
  className?: string
  lineBreakAfter?: readonly number[]
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

export function TrueFocus({
  segments,
  label,
  accentIndexes = [],
  manualMode = false,
  blurAmount = 1.5,
  animationDuration = 0.65,
  pauseBetweenAnimations = 1.3,
  className,
  lineBreakAfter = [],
}: TrueFocusProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const containerRef = useRef<HTMLSpanElement>(null)
  const segmentRefs = useRef<Array<HTMLSpanElement | null>>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [focusRect, setFocusRect] = useState<FocusRect | null>(null)

  const accentSet = useMemo(() => new Set(accentIndexes), [accentIndexes])
  const breakSet = useMemo(() => new Set(lineBreakAfter), [lineBreakAfter])
  const shouldReduceMotion = prefersReducedMotion

  const measure = useCallback(() => {
    const container = containerRef.current
    const activeSegment = segmentRefs.current[currentIndex]
    if (!container || !activeSegment) return

    const containerBox = container.getBoundingClientRect()
    const segmentBox = activeSegment.getBoundingClientRect()

    setFocusRect({
      left: segmentBox.left - containerBox.left - 5,
      top: segmentBox.top - containerBox.top - 3,
      width: segmentBox.width + 10,
      height: segmentBox.height + 6,
    })
  }, [currentIndex])

  useEffect(() => {
    if (shouldReduceMotion || manualMode || segments.length < 2) return

    const interval = window.setInterval(() => {
      setCurrentIndex(index => (index + 1) % segments.length)
    }, (animationDuration + pauseBetweenAnimations) * 1000)

    return () => window.clearInterval(interval)
  }, [animationDuration, manualMode, pauseBetweenAnimations, shouldReduceMotion, segments.length])

  useEffect(() => {
    if (shouldReduceMotion) return

    measure()
    const container = containerRef.current
    const activeSegment = segmentRefs.current[currentIndex]
    const observers: ResizeObserver[] = []

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure)
      if (container) observer.observe(container)
      if (activeSegment) observer.observe(activeSegment)
      observers.push(observer)
    }

    const fonts = 'fonts' in document ? document.fonts : undefined
    fonts?.ready.then(measure).catch(() => undefined)
    window.addEventListener('resize', measure)

    return () => {
      observers.forEach(observer => observer.disconnect())
      window.removeEventListener('resize', measure)
    }
  }, [currentIndex, measure, shouldReduceMotion])

  if (shouldReduceMotion) {
    return <span className={className}>{label}</span>
  }

  return (
    <span className={cn('relative block', className)}>
      <span className="sr-only">{label}</span>
      <span ref={containerRef} aria-hidden="true" className="relative inline-block">
        {focusRect ? (
          <motion.span
            className="pointer-events-none absolute rounded-[0.35rem] border border-accent/55 shadow-[0_0_18px_color-mix(in_oklch,var(--accent)_16%,transparent)]"
            animate={focusRect}
            transition={{ duration: animationDuration, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : null}
        {segments.map((segment, index) => (
          <span key={`${segment}-${index}`}>
            <motion.span
              ref={node => {
                segmentRefs.current[index] = node
              }}
              className={cn('inline-block text-secondary transition-colors', accentSet.has(index) && 'text-accent')}
              animate={{
                opacity: index === currentIndex ? 1 : 0.72,
                filter: index === currentIndex ? 'blur(0px)' : `blur(${blurAmount}px)`,
              }}
              transition={{ duration: animationDuration, ease: 'easeOut' }}
            >
              {segment}
            </motion.span>
            {breakSet.has(index) ? <br /> : ' '}
          </span>
        ))}
      </span>
    </span>
  )
}
