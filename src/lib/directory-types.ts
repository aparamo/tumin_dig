import { z } from "zod";

export const directoryPageSizeSchema = z.union([
  z.literal(10),
  z.literal(25),
  z.literal(50),
  z.literal(100),
]);

export type DirectoryPageSize = z.infer<typeof directoryPageSizeSchema>;

export const directorySortBySchema = z.enum([
  "nombre_asc",
  "nombre_desc",
  "recientes",
]);

export type DirectorySortBy = z.infer<typeof directorySortBySchema>;

export const listMembersInputSchema = z.object({
  cursor: z.number().int().min(0).default(0),
  pageSize: directoryPageSizeSchema.default(10),
  region: z.string().optional(),
  locationState: z.string().optional(),
  locationCountry: z.string().optional(),
  category: z.string().optional(),
  sortBy: directorySortBySchema.default("recientes"),
  search: z.string().max(80).optional(),
});

export type ListMembersInput = z.infer<typeof listMembersInputSchema>;

export interface DirectoryStarProduct {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface DirectoryMemberListItem {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  region: string;
  location: string | null;
  locationCompact: string | null;
  categories: string[];
  starProducts: DirectoryStarProduct[];
  isSavedContact: boolean;
}

export interface DirectoryMemberDetail extends DirectoryMemberListItem {
  bio: string | null;
  phone: string | null;
  email: string | null;
  showPhone: boolean;
  otherProducts: DirectoryStarProduct[];
  publicProfilePath: string;
}

export interface SavedContactListItem {
  id: string;
  contactUserId: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  region: string;
  location: string | null;
  locationCompact: string | null;
  available: boolean;
  phone: string | null;
  email: string | null;
  categories: string[];
  starProducts: DirectoryStarProduct[];
  createdAt: Date;
}

export type DirectoryTab = "miembros" | "contactos";
export type DirectoryViewMode = "card" | "list";
