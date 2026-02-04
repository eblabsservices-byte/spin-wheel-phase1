import { MetadataRoute } from 'next'

// Note: Staging domains are disallowed via X-Robots-Tag header in middleware.ts
// This file primarily guides the production crawler.
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/sys_9e4a/', '/api/'],
    },
    sitemap: 'https://game.yesbharath.org/sitemap.xml',
  }
}
