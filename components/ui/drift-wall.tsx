'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export type DriftWallItem = {
  src?: string
  alt: string
  label?: string
  tone?: string
}

type DriftWallProps = {
  items: DriftWallItem[]
  columns?: number
  mobileColumns?: number
  tileWidth?: number
  tileHeight?: number
  gap?: number
  radius?: number
  tilt?: number
  turn?: number
  perspective?: number
  depth?: number
  speed?: number
  direction?: 'up' | 'down'
  variance?: number
  pauseOnHover?: boolean
  lift?: number
  fade?: number
  dim?: number
  grayscale?: boolean
  overlayColor?: string
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

export function DriftWall({
  items,
  columns = 4,
  mobileColumns = 2,
  tileWidth = 210,
  tileHeight = 150,
  gap = 16,
  radius = 18,
  tilt = 8,
  turn = -6,
  perspective = 1400,
  depth = 70,
  speed = 10,
  direction = 'up',
  variance = 0.25,
  pauseOnHover = true,
  lift = 24,
  fade = 0.72,
  dim = 0.72,
  grayscale = false,
  overlayColor = 'color-mix(in oklch, var(--primary) 24%, transparent)',
  className,
}: DriftWallProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const columnRefs = useRef<(HTMLDivElement | null)[]>([])
  const [paused, setPaused] = useState(false)
  const [visible, setVisible] = useState(false)
  const reducedMotion = useReducedMotion()
  const displayItems = useMemo(() => items.filter(Boolean), [items])
  const colCount = displayItems.length < columns ? displayItems.length : columns

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { threshold: 0.08 })
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (reducedMotion || paused || !visible) return
    let frame = 0
    let last = performance.now()
    const offsets = new Array(colCount).fill(0)

    const tick = (time: number) => {
      const delta = (time - last) / 1000
      last = time
      columnRefs.current.forEach((column, index) => {
        if (!column) return
        const height = column.scrollHeight / 2
        if (!height) return
        const columnSpeed = speed * (1 + index * variance)
        offsets[index] = (offsets[index] + columnSpeed * delta) % height
        const signed = direction === 'up' ? -offsets[index] : offsets[index] - height
        column.style.transform = `translate3d(0, ${signed}px, ${index % 2 ? depth : 0}px)`
      })
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [colCount, depth, direction, paused, reducedMotion, speed, variance, visible])

  if (!displayItems.length) return null

  return (
    <div
      ref={rootRef}
      className={cn('relative h-[30rem] overflow-hidden sm:h-[34rem]', className)}
      onPointerEnter={() => pauseOnHover && setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      style={{ perspective }}
    >
      <div
        className="absolute inset-0 grid grid-cols-2 sm:grid-cols-4"
        style={{
          gap,
          transform: `rotateX(${tilt}deg) rotateZ(${turn}deg) scale(1.04)`,
        }}
      >
        {Array.from({ length: colCount }).map((_, columnIndex) => {
          const columnItems = displayItems.filter((_, index) => index % colCount === columnIndex)
          const loopItems = [...columnItems, ...columnItems]
          return (
            <div
              key={columnIndex}
              ref={node => {
                columnRefs.current[columnIndex] = node
              }}
              className={cn(columnIndex >= mobileColumns && 'hidden sm:block')}
              style={{ display: columnIndex >= mobileColumns ? undefined : 'block' }}
            >
              <div className="grid" style={{ gap }}>
                {loopItems.map((item, index) => (
                  <figure
                    key={`${item.alt}-${columnIndex}-${index}`}
                    className="group relative overflow-hidden bg-card shadow-[0_18px_42px_color-mix(in_oklch,var(--primary)_11%,transparent)]"
                    style={{
                      width: '100%',
                      maxWidth: tileWidth,
                      height: tileHeight,
                      borderRadius: radius,
                      opacity: dim,
                      transform: index % 3 === 0 ? `translateY(${lift / 2}px)` : undefined,
                    }}
                  >
                    {item.src ? (
                      <Image
                        src={item.src}
                        alt={item.alt}
                        fill
                        loading="lazy"
                        sizes="(max-width: 640px) 46vw, 210px"
                        className={cn('object-cover transition duration-500 group-hover:scale-[1.03]', grayscale && 'grayscale')}
                      />
                    ) : (
                      <div className={cn('grid size-full place-items-center p-5 text-center text-sm font-semibold text-primary', item.tone)}>
                        {item.label}
                      </div>
                    )}
                    <div aria-hidden="true" className="absolute inset-0" style={{ background: overlayColor, opacity: item.src ? 0.12 : 0 }} />
                    {item.label && item.src ? (
                      <figcaption className="absolute inset-x-3 bottom-3 rounded-sm bg-background/86 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary backdrop-blur">
                        {item.label}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary to-transparent" style={{ opacity: fade }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-primary to-transparent" style={{ opacity: fade }} />
    </div>
  )
}
