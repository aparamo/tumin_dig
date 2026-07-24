/** Shared UploadThing size caps (MiB strings). Safe for client + server. */
export const UPLOAD_LIMITS = {
  userMediaImage: "4MB",
  userMediaVideo: "128MB",
  avatarImage: "1MB",
} as const;

export type UploadLimitKey = keyof typeof UPLOAD_LIMITS;
