/**
 * Client-side image compression via Canvas.
 * Used before UploadThing so large phone photos fit route maxFileSize.
 */

const MAX_DIMENSION = 2048;
const QUALITIES = [0.82, 0.7, 0.58, 0.45, 0.35] as const;

function isCompressibleImage(file: File): boolean {
  if (!file.type.startsWith("image/")) return false;
  // SVG / animated GIF: canvas re-encode is lossy or inappropriate
  if (file.type === "image/svg+xml" || file.type === "image/gif") return false;
  return true;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("No se pudo comprimir la imagen"));
        else resolve(blob);
      },
      type,
      quality,
    );
  });
}

function drawScaled(
  source: ImageBitmap | HTMLImageElement,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible en este navegador");
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

function outputTypeFor(file: File): string {
  // JPEG is the most reliable size/quality tradeoff for product photos
  if (file.type === "image/png" || file.type === "image/webp") {
    return "image/jpeg";
  }
  if (file.type === "image/jpeg" || file.type === "image/jpg") {
    return "image/jpeg";
  }
  return "image/jpeg";
}

function renameToJpeg(name: string): string {
  return name.replace(/\.[^.]+$/i, "") + ".jpg";
}

export interface CompressImageResult {
  file: File;
  didCompress: boolean;
  originalBytes: number;
}

/**
 * Returns the original file if already under maxBytes.
 * Otherwise re-encodes (and scales down if needed) until under maxBytes or gives up.
 */
export async function compressImageToMaxBytes(
  file: File,
  maxBytes: number,
): Promise<CompressImageResult> {
  const originalBytes = file.size;
  if (file.size <= maxBytes) {
    return { file, didCompress: false, originalBytes };
  }
  if (!isCompressibleImage(file)) {
    throw new Error(
      `No se puede optimizar automáticamente "${file.name}". Usa JPG/PNG/WebP o un archivo de hasta ${(maxBytes / (1024 * 1024)).toFixed(0)} MB.`,
    );
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      `No se pudo leer "${file.name}" para optimizarla. Prueba con JPG o PNG.`,
    );
  }

  try {
    let width = bitmap.width;
    let height = bitmap.height;
    const scale0 = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    width = Math.max(1, Math.round(width * scale0));
    height = Math.max(1, Math.round(height * scale0));

    const outType = outputTypeFor(file);
    const outName = outType === "image/jpeg" ? renameToJpeg(file.name) : file.name;

    for (let round = 0; round < 6; round++) {
      const canvas = drawScaled(bitmap, width, height);
      for (const quality of QUALITIES) {
        const blob = await canvasToBlob(canvas, outType, quality);
        if (blob.size <= maxBytes) {
          const compressed = new File([blob], outName, {
            type: outType,
            lastModified: Date.now(),
          });
          return { file: compressed, didCompress: true, originalBytes };
        }
      }
      // Still too big: shrink dimensions and retry
      width = Math.max(1, Math.round(width * 0.75));
      height = Math.max(1, Math.round(height * 0.75));
    }

    throw new Error(
      `"${file.name}" sigue siendo demasiado grande tras optimizar. Elige una foto más ligera (máx. ${(maxBytes / (1024 * 1024)).toFixed(0)} MB).`,
    );
  } finally {
    bitmap.close();
  }
}
