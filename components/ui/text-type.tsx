'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'

type TextTypeProps = {
  phrases: readonly string[]
  typingSpeed?: number
  deletingSpeed?: number
  pauseDuration?: number
  initialDelay?: number
  showCursor?: boolean
  cursorCharacter?: string
  startOnVisible?: boolean
  fallbackText?: string
  className?: string
  cursorClassName?: string
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)

    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)

    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  return prefersReducedMotion
}

export function TextType({
  phrases,
  typingSpeed = 55,
  deletingSpeed = 28,
  pauseDuration = 1700,
  initialDelay = 800,
  showCursor = true,
  cursorCharacter = '|',
  startOnVisible = true,
  fallbackText,
  className,
  cursorClassName,
}: TextTypeProps) {
  const [displayText, setDisplayText] = useState('')
  const [isVisible, setIsVisible] = useState(!startOnVisible)
  const observerRef = useRef<HTMLSpanElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  const longestPhrase = useMemo(
    () => phrases.reduce((longest, phrase) => (phrase.length > longest.length ? phrase : longest), ''),
    [phrases],
  )

  useEffect(() => {
    if (!startOnVisible || prefersReducedMotion) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 },
    )

    const target = observerRef.current
    if (target) observer.observe(target)
    else setIsVisible(true)

    return () => observer.disconnect()
  }, [prefersReducedMotion, startOnVisible])

  useEffect(() => {
    if (prefersReducedMotion || phrases.length === 0 || !isVisible) return

    let phraseIndex = 0
    let characterIndex = 0
    let deleting = false
    let activeCall: gsap.core.Tween | undefined

    const scheduleNext = (delay: number) => {
      activeCall = gsap.delayedCall(delay / 1000, tick)
    }

    const tick = () => {
      const phrase = phrases[phraseIndex] ?? ''

      if (!deleting) {
        characterIndex += 1
        setDisplayText(phrase.slice(0, characterIndex))

        if (characterIndex === phrase.length) {
          deleting = true
          scheduleNext(pauseDuration)
          return
        }

        scheduleNext(typingSpeed)
        return
      }

      characterIndex -= 1
      setDisplayText(phrase.slice(0, characterIndex))

      if (characterIndex === 0) {
        deleting = false
        phraseIndex = (phraseIndex + 1) % phrases.length
        scheduleNext(typingSpeed)
        return
      }

      scheduleNext(deletingSpeed)
    }

    scheduleNext(initialDelay)

    return () => {
      activeCall?.kill()
    }
  }, [deletingSpeed, initialDelay, isVisible, pauseDuration, phrases, prefersReducedMotion, typingSpeed])

  if (prefersReducedMotion) {
    return <span className={className}>{fallbackText ?? phrases[0]}</span>
  }

  return (
    <span data-text-type-observer="true" className={`inline-grid align-baseline ${className ?? ''}`}>
      <span ref={observerRef} className="invisible col-start-1 row-start-1" aria-hidden="true">
        {longestPhrase}
        {showCursor ? cursorCharacter : null}
      </span>
      <span className="col-start-1 row-start-1 whitespace-nowrap">
        {displayText}
        {showCursor ? (
          <span className={cursorClassName} aria-hidden="true">
            {cursorCharacter}
          </span>
        ) : null}
      </span>
    </span>
  )
}
