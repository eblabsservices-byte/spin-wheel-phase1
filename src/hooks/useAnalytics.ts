"use client";

import { sendGTMEvent, sendGAEvent } from "@next/third-parties/google";

/**
 * Custom hook/utility to send analytics events.
 * It abstracts the underlying GA4/GTM logic so we can switch providers easily or log to console in dev.
 */
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] Event: ${eventName}`, params);
  }

  // Use sendGAEvent for GoogleAnalytics component
  if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag('event', eventName, params);
  }
};
