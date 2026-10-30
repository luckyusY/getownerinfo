export default function manifest() {
  return {
    name: "getownerinfo — Find the real owner",
    short_name: "getownerinfo",
    description:
      "List property, vehicles and assets. Unlock the owner's contact with a secure token fee.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8fa",
    theme_color: "#1668e3",
    icons: [
      { src: "/icon", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
