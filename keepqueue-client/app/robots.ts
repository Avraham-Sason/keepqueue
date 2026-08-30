import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/business/', '/home/'],
    },
    sitemap: 'https://keepqueue.com/sitemap.xml',
  }
}
