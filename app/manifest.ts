import type { MetadataRoute } from "next";

/* Without a manifest iOS treats an added page as a plain bookmark, and Safari
   refuses notifications entirely. Declaring the app properly is what lets a
   reader install it and receive new issues. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Machine Learning Lab Newsletters",
    short_name: "ML Lab",
    description: "Your newsletters, and every new issue on your phone.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f6fb",
    theme_color: "#0b101a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
