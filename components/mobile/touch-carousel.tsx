'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TouchCarouselProps {
  items: React.ReactNode[]
  className?: string
}

export function TouchCarousel({ items, className }: TouchCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTouching, setIsTouching] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [translateX, setTranslateX] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  // Update translateX when currentIndex changes
  useEffect(() => {
    if (containerRef.current) {
      setTranslateX(-(currentIndex * 100))
    }
  }, [currentIndex])

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsTouching(true)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isTouching) return
    
    setTouchEnd(e.targetTouches[0].clientX)
    
    // Calculate how much the user has swiped as a percentage of container width
    const containerWidth = containerRef.current?.clientWidth || 1
    const touchDiff = touchStart - e.targetTouches[0].clientX
    const percentageMoved = (touchDiff / containerWidth) * 100
    
    // Calculate new position with resistance at the edges
    const baseTranslateX = -(currentIndex * 100)
    let newTranslateX = baseTranslateX - percentageMoved
    
    // Add resistance at the edges
    if (currentIndex === 0 && newTranslateX > 0) {
      newTranslateX = newTranslateX * 0.2 // Strong resistance when trying to swipe past first item
    } else if (currentIndex === items.length - 1 && newTranslateX < -(100 * (items.length - 1))) {
      const overscroll = newTranslateX - (-(100 * (items.length - 1)))
      newTranslateX = -(100 * (items.length - 1)) + (overscroll * 0.2) // Resistance at end
    }
    
    setTranslateX(newTranslateX)
  }

  const handleTouchEnd = () => {
    if (!isTouching) return
    
    setIsTouching(false)
    
    // Minimum swipe distance as percentage of width (20%)
    const minSwipeDistance = 20
    
    if (touchStart === 0 || touchEnd === 0) {
      // Reset to current position if no actual swipe
      setTranslateX(-(currentIndex * 100))
      return
    }
    
    // Calculate swipe distance as percentage
    const containerWidth = containerRef.current?.clientWidth || 1
    const touchDiff = touchStart - touchEnd
    const percentageSwiped = (Math.abs(touchDiff) / containerWidth) * 100
    
    if (percentageSwiped >= minSwipeDistance) {
      // Swipe right to left (next)
      if (touchDiff > 0 && currentIndex < items.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
      // Swipe left to right (previous)
      else if (touchDiff < 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      } else {
        // Reset to current position if at the edges
        setTranslateX(-(currentIndex * 100))
      }
    } else {
      // Reset to current position if swipe was too small
      setTranslateX(-(currentIndex * 100))
    }
    
    // Reset touch positions
    setTouchStart(0)
    setTouchEnd(0)
  }

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <div 
        ref={containerRef}
        className="flex transition-transform duration-300 ease-out"
        style={{ 
          transform: `translateX(${translateX}%)`,
          transition: isTouching ? 'none' : 'transform 300ms ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {items.map((item, index) => (
          <div 
            key={index} 
            className="w-full flex-shrink-0"
            style={{ flex: '0 0 100%' }}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              currentIndex === index 
                ? "bg-blue-600 w-4" 
                : "bg-gray-300"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="absolute inset-y-0 left-0 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={cn(
            "h-8 w-8 rounded-full bg-white/80 p-0 text-gray-800 shadow-md",
            currentIndex === 0 && "opacity-50"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous slide</span>
        </Button>
      </div>
      
      <div className="absolute inset-y-0 right-0 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          disabled={currentIndex === items.length - 1}
          className={cn(
            "h-8 w-8 rounded-full bg-white/80 p-0 text-gray-800 shadow-md",
            currentIndex === items.length - 1 && "opacity-50"
          )}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next slide</span>
        </Button>
      </div>
    </div>
  )
}
