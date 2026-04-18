import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, media } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const f = createUploadthing();

const TIER_LIMITS = {
  NORMAL: { totalSpace: 30 * 1024 * 1024, allowVideo: false, maxVideoSize: 0 },
  PAGO: { totalSpace: 120 * 1024 * 1024, allowVideo: true, maxVideoSize: 20 * 1024 * 1024 },
  PATROCINADOR: { totalSpace: 350 * 1024 * 1024, allowVideo: true, maxVideoSize: 80 * 1024 * 1024 },
  FINANCIADOR: { totalSpace: 500 * 1024 * 1024, allowVideo: true, maxVideoSize: 150 * 1024 * 1024 },
};

export const ourFileRouter = {
  userMedia: f({ 
    image: { maxFileSize: "4MB", maxFileCount: 4 },
    video: { maxFileSize: "128MB", maxFileCount: 1 } 
  })
    .middleware(async ({ files }) => {
      const session = await auth();
      if (!session) throw new Error("Unauthorized");
      
      const userId = session.user.id;
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) throw new Error("User not found");

      const tier = user.accountTier as keyof typeof TIER_LIMITS;
      const limits = TIER_LIMITS[tier];

      // Calculate current storage
      const [storageRes] = await db
        .select({ total: sql<number>`sum(${media.sizeBytes})` })
        .from(media)
        .where(eq(media.userId, userId));
      
      const currentUsage = Number(storageRes?.total || 0);
      const incomingSize = files.reduce((acc, f) => acc + f.size, 0);

      if (currentUsage + incomingSize > limits.totalSpace) {
        throw new Error(`Límite de espacio excedido (${tier}). Te quedan ${((limits.totalSpace - currentUsage) / 1024 / 1024).toFixed(2)} MB.`);
      }

      // Video checks
      const hasVideo = files.some(f => f.type.startsWith("video"));
      if (hasVideo) {
        if (!limits.allowVideo) throw new Error(`Tu plan (${tier}) no permite subir videos.`);
        const videoFile = files.find(f => f.type.startsWith("video"));
        if (videoFile && videoFile.size > limits.maxVideoSize) {
          throw new Error(`El video excede el tamaño máximo permitido para tu plan (${(limits.maxVideoSize / 1024 / 1024).toFixed(0)} MB).`);
        }
      }

      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Record media in database
      await db.insert(media).values({
        userId: metadata.userId,
        url: file.url,
        name: file.name,
        sizeBytes: file.size,
        type: file.type.startsWith("video") ? "VIDEO" : "IMAGE",
      });
      return { uploadedBy: metadata.userId };
    }),

  productImage: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      if (!session) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId };
    }),
    
  avatar: f({ image: { maxFileSize: "1MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      if (!session) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db.update(users).set({ avatarUrl: file.url }).where(eq(users.id, metadata.userId));
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
