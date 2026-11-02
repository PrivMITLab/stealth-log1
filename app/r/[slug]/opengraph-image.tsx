import { ImageResponse } from "next/og";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export const alt = "Sentinel link preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const rows = await db.select().from(schema.links).where(eq(schema.links.slug, params.slug));
  const link = rows[0];
  const title = link?.title || "Sentinel Link";
  const host = link ? new URL(link.destinationUrl).hostname : "sentinel";
  return new ImageResponse(
    (
      <div style={{ background: "linear-gradient(135deg,#0a0a0f,#0f172a)", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", color: "white" }}>
        <div style={{ fontSize: 28, color: "#10b981", marginBottom: 20 }}>Sentinel</div>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, marginBottom: 30 }}>{title}</div>
        <div style={{ fontSize: 28, color: "#94a3b8" }}>{host}</div>
        <div style={{ fontSize: 20, color: "#64748b", marginTop: 40 }}>/r/{params.slug}</div>
      </div>
    ),
    size
  );
}