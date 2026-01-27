"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/hooks/useAnalytics";

interface TrackVisibilityProps {
  componentName: string;
  children: React.ReactNode;
  threshold?: number; // 0.0 to 1.0 (percent visible)
}

/**
 * Wraps any component to track when it becomes visible in the viewport.
 * Fires 'component_view' event.
 */
export default function TrackVisibility({
  componentName,
  children,
  threshold = 0.5,
}: TrackVisibilityProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasViewed, setHasViewed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasViewed) {
          trackEvent("component_view", { component_name: componentName });
          setHasViewed(true); // Track only once per page load per component
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [componentName, hasViewed, threshold]);

  return <div ref={ref} className="w-full">{children}</div>;
}