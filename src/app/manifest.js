export default function manifest() {
  return {
    name: "getownerinfo — Find the real owner",
    short_name: "getownerinfo",
    description:
      "List property, vehicles and assets. Unlock verified owner contact with a secure token fee.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8fa",
    theme_color: "#15b0dd",
    icons: [
      { src: "/icon", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
