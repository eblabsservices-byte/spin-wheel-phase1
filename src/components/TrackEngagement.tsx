"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/hooks/useAnalytics";

interface TrackEngagementProps {
  componentName: string; // e.g., 'home_page' or 'spin_wheel_section'
  minTimeSeconds?: number; // Minimum time to consider it an engagement
}

/**
 * Tracks how long a user stays on a page or focused on a component properly.
 * Fires 'user_engagement_time' on unmount/visibility hidden.
 */
export default function TrackEngagement({
  componentName,
  minTimeSeconds = 2,
}: TrackEngagementProps) {
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    // Reset start time on mount
    startTime.current = Date.now();

    const handleUnload = () => {
      const duration = (Date.now() - startTime.current) / 1000;
      if (duration >= minTimeSeconds) {
        trackEvent("engagement_time", {
          component_name: componentName,
          duration_seconds: Math.round(duration),
        });
      }
    };

    // Track when user leaves page or component unmounts
    return () => {
      handleUnload();
    };
  }, [componentName, minTimeSeconds]);

  return null; // This component renders nothing visual
}
