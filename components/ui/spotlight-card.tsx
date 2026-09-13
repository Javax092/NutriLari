'use client'

import { type HTMLAttributes, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type SpotlightCardProps = HTMLAttributes<HTMLDivElement> & {
  spotlightColor?: string
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = 'color-mix(in oklch, var(--accent) 18%, transparent)',
  ...props
}: SpotlightCardProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [active, setActive] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mediaQuery.matches)

    update()
    mediaQuery.addEventListener('change', update)

    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  return (
    <div
      ref={rootRef}
      onPointerEnter={event => {
        if (event.pointerType === 'mouse') setActive(true)
      }}
      onPointerLeave={() => setActive(false)}
      onPointerMove={event => {
        if (event.pointerType !== 'mouse' || reducedMotion) return

        const rect = rootRef.current?.getBoundingClientRect()
        if (!rect) return

        setPosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        })
      }}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 ease-out"
        style={{
          opacity: active ? 1 : 0,
          background: `radial-gradient(circle at ${reducedMotion ? '50% 50%' : `${position.x}px ${position.y}px`}, ${spotlightColor}, transparent 72%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
