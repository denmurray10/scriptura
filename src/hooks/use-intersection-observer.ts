
"use client"

import { useEffect, useState, useRef, RefObject } from 'react';

type IntersectionObserverOptions = IntersectionObserverInit & {
  triggerOnce?: boolean;
};

export function useIntersectionObserver(
  options: IntersectionObserverOptions = {}
): [RefObject<any>, boolean] {
  const { triggerOnce = true, threshold = 0.1, root = null, rootMargin = '0px' } = options;
  const ref = useRef<any>(null);
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIntersecting(true);
        if (triggerOnce && ref.current) {
          observer.unobserve(ref.current);
        }
      } else {
        if (!triggerOnce) {
          setIntersecting(false);
        }
      }
    }, { threshold, root, rootMargin });

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref, threshold, root, rootMargin, triggerOnce]);

  return [ref, isIntersecting];
}
