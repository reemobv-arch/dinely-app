import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Ga betaald bij top restaurants eten met Dinely";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #1a1510 0%, #0b0906 60%)",
          color: "#f5f0e7",
        }}
      >
        <div style={{ fontSize: 40, letterSpacing: 1, display: "flex" }}>
          Dine<span style={{ color: "#c9a24b" }}>ly</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 26, color: "#c9a24b", letterSpacing: 4, textTransform: "uppercase" }}>
            Voor creators
          </div>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, marginTop: 16, maxWidth: 900 }}>
            Ga betaald bij top restaurants eten
          </div>
        </div>
        <div style={{ fontSize: 30, color: "#b4a797" }}>
          Download de app · app.dinely.nl
        </div>
      </div>
    ),
    size
  );
}
