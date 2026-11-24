// Tour thumbnails, stored on disk outside the app's build folders.
// Hostinger replaces the build folders on every deploy, so the default is a
// folder in the account's home directory; UPLOAD_DIR overrides it.
import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const THUMB_DIR = "thumbs";
export const MAX_THUMBNAIL_BYTES = 1.5 * 1024 * 1024;

// Stored names look like "thumbs/<32 hex>.webp"; anything else is refused.
const NAME = /^[a-f0-9]{32}\.(webp|jpg)$/;

export const uploadRoot = () =>
  process.env.UPLOAD_DIR || path.join(homedir(), "360atlas-uploads");

const thumbFile = (name: string) => path.join(uploadRoot(), THUMB_DIR, name);

// The address the site serves a stored thumbnail from.
export const thumbnailUrl = (stored: string | null | undefined) =>
  stored ? `/media/${stored}` : undefined;

// The browser sends a resized WebP or JPEG; check the bytes really are one.
const kindOf = (bytes: Buffer): "webp" | "jpg" | null => {
  if (bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP")
    return "webp";
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  return null;
};

export async function saveThumbnail(
  file: File,
): Promise<{ stored: string } | { error: "badImage" | "imageTooLarge" }> {
  if (file.size > MAX_THUMBNAIL_BYTES) return { error: "imageTooLarge" };
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = kindOf(bytes);
  if (!kind) return { error: "badImage" };

  const name = `${randomBytes(16).toString("hex")}.${kind}`;
  await mkdir(path.join(uploadRoot(), THUMB_DIR), { recursive: true });
  await writeFile(thumbFile(name), bytes);
  return { stored: `${THUMB_DIR}/${name}` };
}

// Removes a stored thumbnail; a missing file is not an error.
export async function deleteThumbnail(stored: string | null | undefined) {
  const name = stored?.startsWith(`${THUMB_DIR}/`) ? stored.slice(THUMB_DIR.length + 1) : "";
  if (!NAME.test(name)) return;
  await unlink(thumbFile(name)).catch(() => undefined);
}

export async function readThumbnail(name: string) {
  if (!NAME.test(name)) return null;
  try {
    const bytes = await readFile(thumbFile(name));
    return { bytes, type: name.endsWith(".webp") ? "image/webp" : "image/jpeg" };
  } catch {
    return null;
  }
}
