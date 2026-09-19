import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/admin",
        "/employees",
        "/planning",
        "/pointage",
        "/profile",
        "/requests",
        "/scan",
        "/concept",
        "/login",
        "/signup",
        "/invitation",
      ],
    },
    sitemap: "https://shiftly.site/sitemap.xml",
  };
}
