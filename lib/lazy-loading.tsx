/**
 * Dynamic component loading utilities for performance optimization
 */
'use client';

import dynamic from 'next/dynamic';
import { ComponentType, useEffect, useRef, useState } from 'react';

// Loading fallback component
export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy loading wrapper with custom loading component
export function withLazyLoading<T extends Record<string, any>>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  loadingComponent?: () => JSX.Element
) {
  return dynamic(importFunc, {
    loading: loadingComponent || LoadingSpinner,
    ssr: false, // Disable SSR for heavy components
  });
}

// Pre-built lazy components for common heavy components
export const LazyChart = dynamic(() => import('recharts').then(mod => ({ default: mod.LineChart })), {
  loading: LoadingSpinner,
  ssr: false,
});

export const LazyEChart = dynamic(() => import('echarts-for-react'), {
  loading: LoadingSpinner,
  ssr: false,
});

// Lazy load AI chat component
export const LazyAIChat = dynamic(() => import('../components/dashboard/ai-chat'), {
  loading: LoadingSpinner,
  ssr: false,
});

// Intersection Observer hook for lazy loading on scroll
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return isVisible;
}

// Lazy component wrapper with intersection observer
export function LazyOnScroll({ 
  children, 
  fallback = <LoadingSpinner />,
  className = ""
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
}

// Image lazy loading component
export function LazyImage({
  src,
  alt,
  className = "",
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(img);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(img);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`relative ${className}`}>
      <img
        ref={imgRef}
        src={isInView ? src : undefined}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
    </div>
  );
}
