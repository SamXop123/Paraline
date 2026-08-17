import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://paraline.vercel.app";
  const currentDate = new Date();

  const routes = [
    "",
    "/faq",
    "/installation",
    "/requirements",
    "/settings",
    "/themes",
    "/privacy",
    "/terms",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : (route === "/privacy" || route === "/terms") ? 0.5 : 0.8,
  }));
}
