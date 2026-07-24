import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, media } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { UPLOAD_LIMITS } from "@/lib/upload-limits";

export { UPLOAD_LIMITS } from "@/lib/upload-limits";

function formatUploadThingCause(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  if (typeof cause === "string") return cause;
  if (cause != null) return String(cause);
  return "";
}

/** Prefer cause detail (actual vs limit) over the generic Invalid config tag. */
function clientUploadThingMessage(message: string, cause: string): string {
  if (cause) return cause;
  return message;
}

const f = createUploadthing({
  errorFormatter: (err) => {
    const cause = formatUploadThingCause(err.cause);

    console.error("[uploadthing]", {
      message: err.message,
      code: err.code,
      cause,
    });

    return {
      message: clientUploadThingMessage(err.message, cause),
      cause,
    };
  },
});

const TIER_LIMITS = {
  NORMAL: { totalSpace: 30 * 1024 * 1024, allowVideo: false, maxVideoSize: 0 },
  PAGO: { totalSpace: 120 * 1024 * 1024, allowVideo: true, maxVideoSize: 20 * 1024 * 1024 },
  PATROCINADOR: { totalSpace: 350 * 1024 * 1024, allowVideo: true, maxVideoSize: 80 * 1024 * 1024 },
  FINANCIADOR: { totalSpace: 500 * 1024 * 1024, allowVideo: true, maxVideoSize: 150 * 1024 * 1024 },
};

async function checkUserLimits(userId: string, files: readonly { size: number; type: string }[]) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new UploadThingError("Usuario no encontrado");

  const tier = user.accountTier as keyof typeof TIER_LIMITS;
  const limits = TIER_LIMITS[tier] ?? TIER_LIMITS.NORMAL;

  const [storageRes] = await db
    .select({ total: sql<number>`sum(${media.sizeBytes})` })
    .from(media)
    .where(eq(media.userId, userId));

  const currentUsage = Number(storageRes?.total || 0);
  const incomingSize = files.reduce((acc, file) => acc + file.size, 0);

  if (currentUsage + incomingSize > limits.totalSpace) {
    throw new UploadThingError(
      `Límite de espacio excedido (${tier}). Te quedan ${((limits.totalSpace - currentUsage) / 1024 / 1024).toFixed(2)} MB.`,
    );
  }

  const hasVideo = files.some((file) => file.type.startsWith("video"));
  if (hasVideo) {
    if (!limits.allowVideo) {
      throw new UploadThingError(`Tu plan (${tier}) no permite subir videos.`);
    }
    const videoFile = files.find((file) => file.type.startsWith("video"));
    if (videoFile && videoFile.size > limits.maxVideoSize) {
      throw new UploadThingError(
        `El video excede el tamaño máximo permitido para tu plan (${(limits.maxVideoSize / 1024 / 1024).toFixed(0)} MB).`,
      );
    }
  }
}

function logIncomingFiles(
  slug: string,
  files: readonly { name: string; size: number; type: string }[],
) {
  console.info(
    "[uploadthing] incoming",
    slug,
    files.map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      sizeMiB: Number((file.size / (1024 * 1024)).toFixed(3)),
    })),
  );
}

export const ourFileRouter = {
  userMedia: f({
    image: { maxFileSize: UPLOAD_LIMITS.userMediaImage, maxFileCount: 4 },
    video: { maxFileSize: UPLOAD_LIMITS.userMediaVideo, maxFileCount: 1 },
  })
    .middleware(async ({ files }) => {
      const session = await auth();
      if (!session?.user?.id) throw new UploadThingError("Debes iniciar sesión para subir archivos");
      const userId = session.user.id;

      logIncomingFiles("userMedia", files);
      await checkUserLimits(userId, files);

      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db.insert(media).values({
        userId: metadata.userId,
        url: file.ufsUrl,
        name: file.name,
        sizeBytes: file.size,
        type: file.type.startsWith("video") ? "VIDEO" : "IMAGE",
      });
      return { uploadedBy: metadata.userId };
    }),

  avatar: f({ image: { maxFileSize: UPLOAD_LIMITS.avatarImage, maxFileCount: 1 } })
    .middleware(async ({ files }) => {
      const session = await auth();
      if (!session?.user?.id) throw new UploadThingError("Debes iniciar sesión para subir archivos");
      const userId = session.user.id;

      logIncomingFiles("avatar", files);
      await checkUserLimits(userId, files);

      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db.update(users).set({ avatarUrl: file.ufsUrl }).where(eq(users.id, metadata.userId));

      await db.insert(media).values({
        userId: metadata.userId,
        url: file.ufsUrl,
        name: `Perfil: ${file.name}`,
        sizeBytes: file.size,
        type: "IMAGE",
      });

      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
