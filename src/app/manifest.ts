import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Perago",
    short_name: "Perago",
    description: "Manage project tenders, clients, documents and drawings.",
    start_url: "/",
    display: "standalone",
    background_color: "#15130f",
    theme_color: "#15130f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
