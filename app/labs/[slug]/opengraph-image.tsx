import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getLab, getLabs } from "@/features/labs/data";

export const alt = "Lab";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getLabs().map((l) => ({ slug: l.slug }));
}

function clip(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, text.lastIndexOf(" ", max)).replace(/[.,;:]$/, "") + "…";
}

async function dataUrl(file: string) {
  try {
    const buf = await fs.readFile(path.join(process.cwd(), "public", file));
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return undefined;
  }
}

/**
 * Soft card on near-black: the captured thumbnail on the left, title and
 * interaction on the right. Satori only reads ttf/otf/woff, and Allo ships
 * woff2 on npm, so this card uses the default font until we add Allo's ttf.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lab = getLab(slug);
  const thumb = lab ? await dataUrl(`/labs/${slug}/thumb-dark.jpg`) : undefined;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#0a0a0a", padding: 40, color: "#fafafa" }}>
        <div style={{ display: "flex", width: "100%", height: "100%", background: "#171717", borderRadius: 56, padding: 24 }}>
          <div style={{ display: "flex", width: 520, height: "100%", background: "#0e0e0e", borderRadius: 36, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
            {thumb ? (
              <img src={thumb} alt="" width={520} height={546} style={{ objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", color: "#666", fontSize: 28 }}>wayne.work</div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "24px 32px 24px 48px" }}>
            <div style={{ display: "flex", fontSize: 26, color: "#8a8a8a" }}>wayne.work / labs</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 72, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>{lab?.title ?? "Labs"}</div>
              <div style={{ display: "flex", marginTop: 20, fontSize: 28, color: "#a3a3a3", lineHeight: 1.35 }}>
                {clip(lab?.description ?? "Interface experiments.", 120)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[lab?.interaction, ...(lab?.tags ?? [])].filter(Boolean).slice(0, 3).map((t) => (
                <div key={t} style={{ display: "flex", background: "#232323", borderRadius: 999, padding: "10px 22px", fontSize: 24 }}>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
