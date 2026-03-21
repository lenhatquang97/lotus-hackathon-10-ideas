import { useEffect, type RefObject } from 'react';

export function useRevealOnScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.animation = 'fade-up 200ms ease forwards';
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    el.classList.add('reveal-hidden');
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
}
