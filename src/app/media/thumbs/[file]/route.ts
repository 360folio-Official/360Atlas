import { readThumbnail } from "@/lib/uploads";

// Serves uploaded tour thumbnails. File names are random and never reused,
// so browsers and the CDN may keep them for a year.
export async function GET(_request: Request, { params }: RouteContext<"/media/thumbs/[file]">) {
  const { file } = await params;
  const thumbnail = await readThumbnail(file);
  if (!thumbnail) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(thumbnail.bytes), {
    headers: {
      "Content-Type": thumbnail.type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
