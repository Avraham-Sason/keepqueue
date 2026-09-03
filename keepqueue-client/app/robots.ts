import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/business/', '/admin/', '/customer/', '/auth/'],
    },
    sitemap: 'https://keepqueue.com/sitemap.xml',
  }
}
