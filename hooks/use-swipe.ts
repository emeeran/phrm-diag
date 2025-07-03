'use client'

import { useState, useRef, useCallback } from 'react'

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

interface SwipeOptions {
  threshold?: number // Minimum distance in pixels
  preventScrollOnSwipe?: boolean
  preventDefaultTouchMove?: boolean
}

interface SwipeProps {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: () => void
}

export function useSwipe(
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
): SwipeProps {
  const {
    threshold = 50,
    preventScrollOnSwipe = false,
    preventDefaultTouchMove = false,
  } = options

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const movingRef = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    }
    touchEndRef.current = null
    movingRef.current = false
  }, [])

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return

      movingRef.current = true
      touchEndRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      }

      if (preventDefaultTouchMove) {
        e.preventDefault()
      }

      if (preventScrollOnSwipe) {
        // Calculate if movement is more horizontal than vertical
        const dx = Math.abs(touchEndRef.current.x - touchStartRef.current.x)
        const dy = Math.abs(touchEndRef.current.y - touchStartRef.current.y)
        
        // If horizontal swipe is detected, prevent default to avoid page scrolling
        if (dx > dy && dx > threshold) {
          e.preventDefault()
        }
      }
    },
    [preventScrollOnSwipe, preventDefaultTouchMove, threshold]
  )

  const onTouchEnd = useCallback(() => {
    if (!touchStartRef.current || !touchEndRef.current || !movingRef.current) {
      return
    }

    const dx = touchEndRef.current.x - touchStartRef.current.x
    const dy = touchEndRef.current.y - touchStartRef.current.y
    const duration = touchEndRef.current.time - touchStartRef.current.time
    
    // Only trigger if swipe is fast enough (less than 300ms)
    const isValidSwipe = duration < 300
    
    if (isValidSwipe) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
        // Horizontal swipe
        if (dx > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight()
        } else if (dx < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft()
        }
      } else if (Math.abs(dy) > threshold) {
        // Vertical swipe
        if (dy > 0 && handlers.onSwipeDown) {
          handlers.onSwipeDown()
        } else if (dy < 0 && handlers.onSwipeUp) {
          handlers.onSwipeUp()
        }
      }
    }

    // Reset refs
    touchStartRef.current = null
    touchEndRef.current = null
    movingRef.current = false
  }, [handlers, threshold])

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}
