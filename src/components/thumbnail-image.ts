// Turns a picked photo into the tour thumbnail before it is uploaded:
// centre-cropped to 16:10, at most 1600×1000, saved as WebP (JPEG where the
// browser can't write WebP). Keeps uploads small and the server simple.

const ASPECT = 16 / 10;
const MAX_WIDTH = 1600;

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

export async function makeThumbnail(file: File): Promise<Blob> {
  // Respects the photo's rotation (EXIF) in current browsers.
  const image = await createImageBitmap(file);

  // The largest 16:10 area in the middle of the image.
  let cropW = image.width;
  let cropH = Math.round(cropW / ASPECT);
  if (cropH > image.height) {
    cropH = image.height;
    cropW = Math.round(cropH * ASPECT);
  }
  const cropX = Math.round((image.width - cropW) / 2);
  const cropY = Math.round((image.height - cropH) / 2);

  const width = Math.min(MAX_WIDTH, cropW);
  const height = Math.round(width / ASPECT);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, width, height);
  image.close();

  const webp = await toBlob(canvas, "image/webp", 0.82);
  if (webp?.type === "image/webp") return webp;
  const jpeg = await toBlob(canvas, "image/jpeg", 0.85);
  if (!jpeg) throw new Error("Could not encode image");
  return jpeg;
}
