import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Trace — Your digital footprint",
    short_name: "Trace",
    description: "A little clarity. A lot more control over your digital footprint.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f8f4",
    theme_color: "#f7f8f4",
    categories: ["utilities", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
