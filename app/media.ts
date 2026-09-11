/* Media helpers.

   The workspace is stored as a single JSON blob (2MB cap, see api/workspace),
   and no object storage is configured, so uploaded images are downscaled in
   the browser and inlined as data URLs. Video is referenced by link for the
   same reason — a video file would not fit. */

export const MAX_EDGE = 1200;
export const MAX_BYTES = 700_000;

/** Shrink an image file to something safe to inline, as a JPEG data URL. */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(Error("Canvas unavailable"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Step the quality down until it fits the inline budget.
      let quality = 0.82;
      let out = canvas.toDataURL("image/jpeg", quality);
      while (out.length > MAX_BYTES && quality > 0.4) {
        quality -= 0.12;
        out = canvas.toDataURL("image/jpeg", quality);
      }
      if (out.length > MAX_BYTES)
        return reject(Error("That image is too large to store."));
      resolve(out);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(Error("That file could not be read as an image."));
    };
    img.src = url;
  });
}

export type Embed = { kind: "youtube" | "vimeo" | "file"; src: string };

/** Turn a pasted video link into something embeddable. */
export function toEmbed(raw: string): Embed | null {
  const value = raw.trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return id ? { kind: "youtube", src: "https://www.youtube.com/embed/" + id } : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = url.searchParams.get("v") || url.pathname.split("/").pop();
    return id ? { kind: "youtube", src: "https://www.youtube.com/embed/" + id } : null;
  }
  if (host === "vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id ? { kind: "vimeo", src: "https://player.vimeo.com/video/" + id } : null;
  }
  if (/\.(mp4|webm|ogg|mov)$/i.test(url.pathname))
    return { kind: "file", src: url.href };
  return null;
}

/** True for anything we can show in an <img>. */
export const isImageSrc = (src: string) =>
  src.startsWith("data:image/") || /^https?:\/\//.test(src);
