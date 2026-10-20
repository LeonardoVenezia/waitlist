import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://waitlist.leovenezia.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/launches", "/products", "/product/", "/p/", "/wall/", "/pricing"],
        disallow: ["/dashboard", "/admin", "/api/", "/auth/", "/preview"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
