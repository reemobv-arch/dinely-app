// Verkleint een afbeelding client-side vóór het uploaden, zodat we geen foto's
// van meerdere MB rondsturen. De maat-berekening is pure logica (getest); de
// canvas-conversie draait alleen in de browser.

/** Nieuwe afmetingen zodat de langste zijde hoogstens maxDim is (nooit vergroten). */
export function computeSize(
  w: number,
  h: number,
  maxDim: number
): { w: number; h: number } {
  if (w <= 0 || h <= 0) return { w: 0, h: 0 };
  const langste = Math.max(w, h);
  if (langste <= maxDim) return { w: Math.round(w), h: Math.round(h) };
  const schaal = maxDim / langste;
  return { w: Math.round(w * schaal), h: Math.round(h * schaal) };
}

/**
 * Verkleint + comprimeert een afbeelding naar JPEG. Valt terug op het origineel
 * als het geen afbeelding is of de browser het niet ondersteunt.
 */
export async function resizeImageFile(
  file: File,
  opts?: { maxDim?: number; quality?: number }
): Promise<Blob> {
  const maxDim = opts?.maxDim ?? 1280;
  const quality = opts?.quality ?? 0.82;
  if (!file.type.startsWith("image/")) return file;
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  try {
    const { w, h } = computeSize(bitmap.width, bitmap.height, maxDim);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", quality)
    );
    // Alleen gebruiken als het écht kleiner is; anders het origineel.
    if (blob && blob.size > 0 && blob.size < file.size) return blob;
    return file;
  } catch {
    return file;
  } finally {
    bitmap.close?.();
  }
}
