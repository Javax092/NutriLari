'use client'

import { useEffect } from 'react'
import { trackPageViewOnce } from '@/lib/tracking'

export function LeadTracker() {
  useEffect(() => {
    trackPageViewOnce()
  }, [])

  return null
}
