
"use client";

import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { cn } from '@/lib/utils';
import React from 'react';

type AnimateInViewProps = {
  children: React.ReactNode;
  className?: string;
  tag?: React.ElementType;
};

export function AnimateInView({
  children,
  className,
  tag: Component = 'div',
}: AnimateInViewProps) {
  const [ref, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <Component
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
    >
      {children}
    </Component>
  );
}
