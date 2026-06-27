import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "getownerinfo — Find the real owner";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #071c1f 0%, #0c3f47 55%, #15b0dd 140%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#15b0dd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 800 }}>g</div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>getownerinfo</div>
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
          Find the real owner.
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, color: "#7fd6ee" }}>Skip the brokers.</div>
        <div style={{ marginTop: 36, fontSize: 30, color: "rgba(255,255,255,0.8)", maxWidth: 820 }}>
          Verified owners across Rwanda. Unlock contact with a secure token fee.
        </div>
      </div>
    ),
    size
  );
}
