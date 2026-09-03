import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://keepqueue.com";
    const lastModified = new Date();

    return [
        {
            url: baseUrl,
            lastModified,
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${baseUrl}/marketplace`,
            lastModified,
            changeFrequency: "daily",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified,
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified,
            changeFrequency: "yearly",
            priority: 0.3,
        },
    ];
}
