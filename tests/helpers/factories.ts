import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, products } from "@/db/schema";
import { issueFromSystem } from "@/lib/system-ledger";
import { ensureSystemUser } from "@/lib/system-user";
import type { UserRole } from "@/lib/trpc/authorization";

const BCRYPT_ROUNDS = 4;

export interface MakeUserOptions {
  id?: string;
  name?: string;
  phone?: string;
  email?: string | null;
  nip?: string;
  region?: string;
  role?: UserRole;
  status?: "ACTIVO" | "CONGELADO";
  isVerified?: boolean;
  referrerId?: string | null;
  firstSaleOk?: boolean;
  productOk?: boolean;
  duplicatorBonus?: number;
  residenceState?: string | null;
  residenceCountry?: string | null;
  publicProfile?: boolean;
}

let userSeq = 0;

export async function makeUser(opts: MakeUserOptions = {}) {
  userSeq += 1;
  const id = opts.id ?? `user_${userSeq}_${randomUUID().slice(0, 8)}`;
  const phone = opts.phone ?? `555${String(1_000_000 + userSeq).slice(-7)}`;
  const nipPlain = opts.nip ?? "1234";
  const nipHash = await bcrypt.hash(nipPlain, BCRYPT_ROUNDS);

  const [row] = await db
    .insert(users)
    .values({
      id,
      name: opts.name ?? `Usuario ${userSeq}`,
      phone,
      email: opts.email === undefined ? `${id}@test.local` : opts.email,
      nip: nipHash,
      region: opts.region ?? "VERACRUZ",
      role: opts.role ?? "SOCIO",
      status: opts.status ?? "ACTIVO",
      isVerified: opts.isVerified ?? true,
      referrerId: opts.referrerId ?? null,
      firstSaleOk: opts.firstSaleOk ?? false,
      productOk: opts.productOk ?? false,
      duplicatorBonus: opts.duplicatorBonus ?? 0,
      residenceState: opts.residenceState ?? "Veracruz",
      residenceCountry: opts.residenceCountry ?? "México",
      publicProfile: opts.publicProfile ?? true,
    })
    .returning();

  return { ...row, nipPlain };
}

export interface MakeProductOptions {
  sellerId: string;
  name?: string;
  priceMxn?: number;
  priceTumin?: number;
  categories?: string[];
  region?: string;
  status?: "ACTIVO" | "INACTIVO";
  showInProfile?: boolean;
  isStarred?: boolean;
  imgUrls?: string[];
}

export async function makeProduct(opts: MakeProductOptions) {
  const [row] = await db
    .insert(products)
    .values({
      sellerId: opts.sellerId,
      name: opts.name ?? "Producto de prueba",
      priceMxn: opts.priceMxn ?? 90,
      priceTumin: opts.priceTumin ?? 10,
      categories: opts.categories ?? ["Alimentos"],
      region: opts.region ?? "VERACRUZ",
      status: opts.status ?? "ACTIVO",
      showInProfile: opts.showInProfile ?? true,
      isStarred: opts.isStarred ?? false,
      imgUrls: opts.imgUrls ?? [],
    })
    .returning();

  await db
    .update(users)
    .set({ productOk: true })
    .where(eq(users.id, opts.sellerId));

  return row;
}

/** Mint Tumin from SYSTEM into a user account (uses the real issuance path). */
export async function mint(toId: string, amount: number, concept = "Test mint") {
  await ensureSystemUser(db);
  return issueFromSystem(db, {
    toId,
    amount,
    concept,
    type: "BONO",
  });
}
