// Draws one category card as an image, so every card in the spiral has the
// same size and shape. Matches the gradient tiles used elsewhere on the site.

export const CARD_W = 600;
export const CARD_H = 450;

type CardInput = {
  hue: number;
  icon: string;
  name: string;
  countText: string;
  rtl: boolean;
  font: string;
};

function roundedRect(ctx: CanvasRenderingContext2D, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(w, 0, w, h, r);
  ctx.arcTo(w, h, 0, h, r);
  ctx.arcTo(0, h, 0, 0, r);
  ctx.arcTo(0, 0, w, 0, r);
  ctx.closePath();
}

// Splits the name into at most two lines that fit, shrinking the text if needed.
function fitName(ctx: CanvasRenderingContext2D, name: string, font: string, maxWidth: number) {
  for (let size = 52; size >= 30; size -= 2) {
    ctx.font = `700 ${size}px ${font}`;
    const words = name.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth || !line) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
    const fits = lines.every((l) => ctx.measureText(l).width <= maxWidth);
    if (lines.length <= 2 && fits) return { size, lines };
  }
  ctx.font = `700 30px ${font}`;
  return { size: 30, lines: [name] };
}

export function drawCategoryCard({ hue, icon, name, countText, rtl, font }: CardInput): string {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  roundedRect(ctx, CARD_W, CARD_H, 36);
  ctx.save();
  ctx.clip();

  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bg.addColorStop(0, `hsl(${hue} 52% 40%)`);
  bg.addColorStop(0.8, `hsl(${(hue + 40) % 360} 58% 17%)`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Soft light in the top corner.
  const glow = ctx.createRadialGradient(CARD_W * 0.2, 0, 0, CARD_W * 0.2, 0, CARD_W * 0.7);
  glow.addColorStop(0, "rgba(255,255,255,0.18)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const pad = 44;
  const start = rtl ? CARD_W - pad : pad;
  const end = rtl ? pad : CARD_W - pad;

  // Large faded icon bleeding off the far corner.
  ctx.globalAlpha = 0.22;
  ctx.font = `230px ${font}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(icon, rtl ? 70 : CARD_W - 70, 80);
  ctx.globalAlpha = 1;

  // Small icon, then the name and tour count at the bottom.
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
  ctx.font = `76px ${font}`;
  ctx.fillText(icon, start, 128);

  ctx.fillStyle = "#ffffff";
  const { size, lines } = fitName(ctx, name, font, Math.abs(end - start));
  const lineHeight = size * 1.12;
  const countY = CARD_H - pad;
  let y = countY - 46 - lineHeight * (lines.length - 1);
  for (const line of lines) {
    ctx.fillText(line, start, y);
    y += lineHeight;
  }

  ctx.font = `500 28px ${font}`;
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.fillText(countText, start, countY);

  ctx.restore();

  // Thin edge so cards read against the dark background.
  roundedRect(ctx, CARD_W, CARD_H, 36);
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 3;
  ctx.stroke();

  return canvas.toDataURL("image/png");
}
