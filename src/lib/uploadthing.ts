import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { UPLOAD_LIMITS } from "@/lib/upload-limits";
import { compressImageToMaxBytes } from "@/lib/compress-image";
import { parseErrorMessage } from "@/lib/parse-error";

export { UPLOAD_LIMITS } from "@/lib/upload-limits";
export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

const MI_B = 1024 * 1024;

/** Parse UploadThing FileSize strings like "4MB" into bytes (1024-based). */
export function uploadLimitToBytes(limit: string): number {
  const match = /^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i.exec(limit.trim());
  if (!match) {
    throw new Error(`Límite de archivo inválido: ${limit}`);
  }
  const value = Number(match[1]);
  const unit = match[2].toUpperCase();
  const pow = unit === "B" ? 0 : unit === "KB" ? 1 : unit === "MB" ? 2 : 3;
  return Math.floor(value * Math.pow(1024, pow));
}

export const UPLOAD_LIMIT_BYTES = {
  userMediaImage: uploadLimitToBytes(UPLOAD_LIMITS.userMediaImage),
  userMediaVideo: uploadLimitToBytes(UPLOAD_LIMITS.userMediaVideo),
  avatarImage: uploadLimitToBytes(UPLOAD_LIMITS.avatarImage),
} as const;

export function formatMiB(bytes: number): string {
  return `${(bytes / MI_B).toFixed(3)} MB`;
}

export interface PrepareUploadOpts {
  imageMaxBytes: number;
  videoMaxBytes?: number;
  label: string;
}

export type PrepareUploadResult =
  | { ok: true; files: File[]; note?: string }
  | { ok: false; message: string };

/**
 * Validates size and auto-compresses oversized images (canvas).
 * Never throws — safe for UploadThing `onBeforeUploadBegin` (throws there
 * bypass UT's catch and become Next.js runtime errors).
 */
export async function prepareFilesForUpload(
  files: File[],
  opts: PrepareUploadOpts,
): Promise<PrepareUploadResult> {
  const out: File[] = [];
  const notes: string[] = [];

  for (const file of files) {
    const isVideo = file.type.startsWith("video/");
    const max = isVideo
      ? (opts.videoMaxBytes ?? opts.imageMaxBytes)
      : opts.imageMaxBytes;

    if (file.size <= max) {
      out.push(file);
      continue;
    }

    if (isVideo) {
      return {
        ok: false,
        message: `El video "${file.name}" pesa ${formatMiB(file.size)} y el máximo para ${opts.label} es ${formatMiB(max)}. Acórtalo o súbelo con menor calidad.`,
      };
    }

    if (!file.type.startsWith("image/")) {
      return {
        ok: false,
        message: `El archivo "${file.name}" pesa ${formatMiB(file.size)} y el máximo para ${opts.label} es ${formatMiB(max)}. Elige un archivo más ligero.`,
      };
    }

    try {
      const compressed = await compressImageToMaxBytes(file, max);
      out.push(compressed.file);
      if (compressed.didCompress) {
        notes.push(
          `Optimizamos "${file.name}" de ${formatMiB(compressed.originalBytes)} a ${formatMiB(compressed.file.size)}.`,
        );
      }
    } catch (err) {
      return {
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : `No se pudo optimizar "${file.name}". Usa una imagen de hasta ${formatMiB(max)}.`,
      };
    }
  }

  return {
    ok: true,
    files: out,
    note: notes.length > 0 ? notes.join(" ") : undefined,
  };
}

export interface UploadBeginHandlers {
  onBeforeUploadBegin: (files: File[]) => Promise<File[]>;
  onUploadError: (error: Error) => void;
}

/**
 * Wiring for UploadButton: compress/validate without throwing, show feedback dialogs.
 * Empty-file aborts after validation are swallowed so Next does not show a runtime error.
 */
export function createUploadBeginHandlers(
  feedback: {
    notifyError: (message: string) => void;
    notifySuccess: (message: string) => void;
  },
  opts: PrepareUploadOpts,
): UploadBeginHandlers {
  let abortedForValidation = false;

  return {
    onBeforeUploadBegin: async (files) => {
      abortedForValidation = false;
      const result = await prepareFilesForUpload(files, opts);
      if (!result.ok) {
        abortedForValidation = true;
        feedback.notifyError(result.message);
        return [];
      }
      if (result.files.length === 0) {
        abortedForValidation = true;
        feedback.notifyError("No hay archivos para subir.");
        return [];
      }
      if (result.note) {
        feedback.notifySuccess(result.note);
      }
      return result.files;
    },
    onUploadError: (error) => {
      if (abortedForValidation) {
        abortedForValidation = false;
        return;
      }
      // Empty-file abort sometimes surfaces as a generic UT client error
      const msg = error.message ?? "";
      if (/no files|empty|at least one/i.test(msg) && abortedForValidation) {
        return;
      }
      feedback.notifyError(parseErrorMessage(error));
    },
  };
}

/** Prefer ufsUrl (UploadThing v7); fall back to deprecated url for older responses. */
export function getUploadedFileUrl(file: {
  ufsUrl?: string;
  url?: string;
}): string {
  return file.ufsUrl || file.url || "";
}
