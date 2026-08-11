import { createTRPCRouter, protectedProcedure } from "../../lib/trpc/server";
import { db } from "../../db";
import { users, products, savedContacts } from "../../db/schema";
import {
  eq,
  and,
  ne,
  ilike,
  or,
  sql,
  desc,
  asc,
  inArray,
  notInArray,
  exists,
} from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  formatCompactLocation,
  formatPublicLocation,
  getAllConsolidatedEnrollmentDbValues,
  getEnrollmentRegionDbValues,
  isEnrollmentFilterOthers,
  isSystemUserRegion,
  normalizeEnrollmentRegion,
} from "../../lib/location";
import { SYSTEM_ACCOUNT_IDS, isSystemAccountId } from "../../lib/system-user";
import { listMembersInputSchema } from "../../lib/directory-types";
import type {
  DirectoryMemberListItem,
  DirectoryStarProduct,
  SavedContactListItem,
} from "../../lib/directory-types";

function displayNameFrom(u: { publicName: string | null; name: string }) {
  return (u.publicName?.trim() ? u.publicName.trim() : null) ?? u.name;
}

function mapLocation(u: {
  showRegion: boolean;
  residenceCountry: string | null;
  residenceState: string | null;
  residenceCity: string | null;
  residencePostalCode: string | null;
}) {
  if (!u.showRegion) {
    return { location: null as string | null, locationCompact: null as string | null };
  }
  const residence = {
    residenceCountry: u.residenceCountry,
    residenceState: u.residenceState,
    residenceCity: u.residenceCity,
    residencePostalCode: u.residencePostalCode,
  };
  return {
    location: formatPublicLocation(residence),
    locationCompact: formatCompactLocation(residence),
  };
}

function productThumb(p: {
  id: string;
  name: string;
  imageUrl: string | null;
  imgUrls: string[] | null;
}): DirectoryStarProduct {
  const fromUrls = p.imgUrls && p.imgUrls.length > 0 ? p.imgUrls[0] ?? null : null;
  return {
    id: p.id,
    name: p.name,
    imageUrl: fromUrls ?? p.imageUrl ?? null,
  };
}

function aggregateProducts(
  sellerProducts: Array<{
    sellerId: string;
    id: string;
    name: string;
    imageUrl: string | null;
    imgUrls: string[] | null;
    categories: string[];
    isStarred: boolean;
  }>
) {
  const bySeller = new Map<
    string,
    { categories: Set<string>; stars: DirectoryStarProduct[]; others: DirectoryStarProduct[] }
  >();

  for (const p of sellerProducts) {
    let bucket = bySeller.get(p.sellerId);
    if (!bucket) {
      bucket = { categories: new Set(), stars: [], others: [] };
      bySeller.set(p.sellerId, bucket);
    }
    for (const c of p.categories ?? []) bucket.categories.add(c);
    const thumb = productThumb(p);
    if (p.isStarred) bucket.stars.push(thumb);
    else bucket.others.push(thumb);
  }

  return bySeller;
}

export const directoryRouter = createTRPCRouter({
  listMembers: protectedProcedure.input(listMembersInputSchema).query(async ({ ctx, input }) => {
    const viewerId = ctx.session.user.id;
    const viewerResidenceState = ctx.session.user.residenceState ?? null;
    const viewerResidenceCountry = ctx.session.user.residenceCountry ?? null;
    const { cursor, pageSize, sortBy } = input;
    const offset = cursor;

    const conditions = [
      eq(users.publicProfile, true),
      eq(users.status, "ACTIVO"),
      ne(users.id, viewerId),
      notInArray(users.id, [...SYSTEM_ACCOUNT_IDS]),
      // Belt-and-suspenders: hide technical adscripción labels
      sql`UPPER(TRIM(${users.region})) NOT IN ('SISTEMA', 'SYSTEM', 'GENERAL')`,
    ];

    if (input.region && input.region !== "Todas") {
      if (isEnrollmentFilterOthers(input.region)) {
        const consolidated = getAllConsolidatedEnrollmentDbValues();
        conditions.push(notInArray(users.region, consolidated));
      } else {
        const matchValues = getEnrollmentRegionDbValues(input.region);
        conditions.push(inArray(users.region, matchValues));
      }
    }
    if (input.locationState && input.locationState !== "Todas") {
      conditions.push(eq(users.residenceState, input.locationState));
    } else if (input.locationCountry && input.locationCountry !== "Todas") {
      conditions.push(eq(users.residenceCountry, input.locationCountry));
    }

    if (input.search?.trim()) {
      const q = `%${input.search.trim()}%`;
      conditions.push(or(ilike(users.name, q), ilike(users.publicName, q))!);
    }

    if (input.category && input.category !== "Todas") {
      const cat = input.category;
      conditions.push(
        exists(
          db
            .select({ id: products.id })
            .from(products)
            .where(
              and(
                eq(products.sellerId, users.id),
                eq(products.status, "ACTIVO"),
                eq(products.showInProfile, true),
                sql`${products.categories} @> ${JSON.stringify([cat])}::jsonb`
              )
            )
        )
      );
    }

    const orderBys = [];
    if (sortBy === "cercania") {
      if (viewerResidenceState) {
        orderBys.push(
          sql`CASE WHEN ${users.residenceState} = ${viewerResidenceState} THEN 0 ELSE 1 END ASC`
        );
      } else if (viewerResidenceCountry) {
        orderBys.push(
          sql`CASE WHEN ${users.residenceCountry} = ${viewerResidenceCountry} THEN 0 ELSE 1 END ASC`
        );
      }
      orderBys.push(asc(sql`COALESCE(${users.publicName}, ${users.name})`));
    } else if (sortBy === "nombre_asc") {
      orderBys.push(asc(sql`COALESCE(${users.publicName}, ${users.name})`));
    } else if (sortBy === "nombre_desc") {
      orderBys.push(desc(sql`COALESCE(${users.publicName}, ${users.name})`));
    } else {
      orderBys.push(desc(users.createdAt));
    }

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        publicName: users.publicName,
        avatarUrl: users.avatarUrl,
        isVerified: users.isVerified,
        region: users.region,
        showRegion: users.showRegion,
        residenceCountry: users.residenceCountry,
        residenceState: users.residenceState,
        residenceCity: users.residenceCity,
        residencePostalCode: users.residencePostalCode,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(...orderBys)
      .limit(pageSize + 1)
      .offset(offset);

    let nextCursor: number | undefined;
    const page = [...rows];
    if (page.length > pageSize) {
      page.pop();
      nextCursor = offset + pageSize;
    }

    const ids = page.map((r) => r.id);
    if (ids.length === 0) {
      return { items: [] as DirectoryMemberListItem[], nextCursor };
    }

    const sellerProducts = await db
      .select({
        sellerId: products.sellerId,
        id: products.id,
        name: products.name,
        imageUrl: products.imageUrl,
        imgUrls: products.imgUrls,
        categories: products.categories,
        isStarred: products.isStarred,
      })
      .from(products)
      .where(
        and(
          inArray(products.sellerId, ids),
          eq(products.status, "ACTIVO"),
          eq(products.showInProfile, true)
        )
      );

    const agg = aggregateProducts(sellerProducts);

    const savedRows = await db
      .select({ contactUserId: savedContacts.contactUserId })
      .from(savedContacts)
      .where(and(eq(savedContacts.ownerId, viewerId), inArray(savedContacts.contactUserId, ids)));

    const savedSet = new Set(savedRows.map((r) => r.contactUserId));

    const items: DirectoryMemberListItem[] = page.map((u) => {
      const loc = mapLocation(u);
      const bucket = agg.get(u.id);
      return {
        id: u.id,
        displayName: displayNameFrom(u),
        avatarUrl: u.avatarUrl ?? null,
        isVerified: u.isVerified,
        region: normalizeEnrollmentRegion(u.region),
        location: loc.location,
        locationCompact: loc.locationCompact,
        categories: bucket ? Array.from(bucket.categories) : [],
        starProducts: bucket ? bucket.stars.slice(0, 3) : [],
        isSavedContact: savedSet.has(u.id),
      };
    });

    return { items, nextCursor };
  }),

  getMemberDetail: protectedProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const viewerId = ctx.session.user.id;
      const [u] = await db
        .select({
          id: users.id,
          name: users.name,
          publicName: users.publicName,
          avatarUrl: users.avatarUrl,
          bio: users.bio,
          isVerified: users.isVerified,
          region: users.region,
          showRegion: users.showRegion,
          showPhone: users.showPhone,
          showEmail: users.showEmail,
          phone: users.phone,
          email: users.email,
          publicProfile: users.publicProfile,
          status: users.status,
          residenceCountry: users.residenceCountry,
          residenceState: users.residenceState,
          residenceCity: users.residenceCity,
          residencePostalCode: users.residencePostalCode,
        })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!u || !u.publicProfile || u.status !== "ACTIVO" || isSystemAccountId(u.id) || isSystemUserRegion(u.region) || u.region.trim().toUpperCase() === "GENERAL") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Perfil no disponible" });
      }

      const sellerProducts = await db
        .select({
          sellerId: products.sellerId,
          id: products.id,
          name: products.name,
          imageUrl: products.imageUrl,
          imgUrls: products.imgUrls,
          categories: products.categories,
          isStarred: products.isStarred,
        })
        .from(products)
        .where(
          and(
            eq(products.sellerId, u.id),
            eq(products.status, "ACTIVO"),
            eq(products.showInProfile, true)
          )
        )
        .orderBy(desc(products.isStarred), desc(products.createdAt));

      const agg = aggregateProducts(sellerProducts);
      const bucket = agg.get(u.id);
      const loc = mapLocation(u);

      const [saved] = await db
        .select({ id: savedContacts.id })
        .from(savedContacts)
        .where(and(eq(savedContacts.ownerId, viewerId), eq(savedContacts.contactUserId, u.id)))
        .limit(1);

      return {
        id: u.id,
        displayName: displayNameFrom(u),
        avatarUrl: u.avatarUrl ?? null,
        isVerified: u.isVerified,
        region: normalizeEnrollmentRegion(u.region),
        location: loc.location,
        locationCompact: loc.locationCompact,
        categories: bucket ? Array.from(bucket.categories) : [],
        starProducts: bucket ? bucket.stars.slice(0, 5) : [],
        otherProducts: bucket ? bucket.others.slice(0, 6) : [],
        isSavedContact: !!saved,
        bio: u.bio?.trim() ? u.bio.trim() : null,
        phone: u.showPhone ? u.phone : null,
        email: u.showEmail ? (u.email ?? null) : null,
        showPhone: u.showPhone,
        publicProfilePath: `/u/${u.id}`,
      };
    }),

  listSavedContacts: protectedProcedure
    .input(
      z
        .object({
          cursor: z.number().int().min(0).default(0),
          pageSize: z.union([z.literal(10), z.literal(25), z.literal(50), z.literal(100)]).default(25),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const viewerId = ctx.session.user.id;
      const cursor = input?.cursor ?? 0;
      const pageSize = input?.pageSize ?? 25;

      const rows = await db
        .select({
          id: savedContacts.id,
          contactUserId: savedContacts.contactUserId,
          createdAt: savedContacts.createdAt,
          name: users.name,
          publicName: users.publicName,
          avatarUrl: users.avatarUrl,
          isVerified: users.isVerified,
          region: users.region,
          showRegion: users.showRegion,
          showPhone: users.showPhone,
          showEmail: users.showEmail,
          phone: users.phone,
          email: users.email,
          publicProfile: users.publicProfile,
          status: users.status,
          residenceCountry: users.residenceCountry,
          residenceState: users.residenceState,
          residenceCity: users.residenceCity,
          residencePostalCode: users.residencePostalCode,
        })
        .from(savedContacts)
        .innerJoin(users, eq(savedContacts.contactUserId, users.id))
        .where(eq(savedContacts.ownerId, viewerId))
        .orderBy(desc(savedContacts.createdAt))
        .limit(pageSize + 1)
        .offset(cursor);

      let nextCursor: number | undefined;
      const page = [...rows];
      if (page.length > pageSize) {
        page.pop();
        nextCursor = cursor + pageSize;
      }

      const contactIds = page.map((r) => r.contactUserId);
      const sellerProducts =
        contactIds.length > 0
          ? await db
              .select({
                sellerId: products.sellerId,
                id: products.id,
                name: products.name,
                imageUrl: products.imageUrl,
                imgUrls: products.imgUrls,
                categories: products.categories,
                isStarred: products.isStarred,
              })
              .from(products)
              .where(
                and(
                  inArray(products.sellerId, contactIds),
                  eq(products.status, "ACTIVO"),
                  eq(products.showInProfile, true)
                )
              )
          : [];

      const agg = aggregateProducts(sellerProducts);

      const items: SavedContactListItem[] = page.map((r) => {
        const available = r.publicProfile && r.status === "ACTIVO";
        const loc = available ? mapLocation(r) : { location: null, locationCompact: null };
        const bucket = available ? agg.get(r.contactUserId) : undefined;
        return {
          id: r.id,
          contactUserId: r.contactUserId,
          displayName: available ? displayNameFrom(r) : "Contacto no disponible",
          avatarUrl: available ? (r.avatarUrl ?? null) : null,
          isVerified: available ? r.isVerified : false,
          region: available ? normalizeEnrollmentRegion(r.region) : "",
          location: loc.location,
          locationCompact: loc.locationCompact,
          available,
          phone: available && r.showPhone ? r.phone : null,
          email: available && r.showEmail ? (r.email ?? null) : null,
          categories: bucket ? Array.from(bucket.categories) : [],
          starProducts: bucket ? bucket.stars.slice(0, 3) : [],
          createdAt: r.createdAt,
        };
      });

      return { items, nextCursor };
    }),

  saveContact: protectedProcedure
    .input(z.object({ contactUserId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session.user.id;
      if (input.contactUserId === ownerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No puedes guardarte a ti mismo" });
      }

      const [target] = await db
        .select({
          id: users.id,
          publicProfile: users.publicProfile,
          status: users.status,
        })
        .from(users)
        .where(eq(users.id, input.contactUserId))
        .limit(1);

      if (!target || !target.publicProfile || target.status !== "ACTIVO") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Perfil no disponible" });
      }

      await db
        .insert(savedContacts)
        .values({ ownerId, contactUserId: input.contactUserId })
        .onConflictDoNothing({
          target: [savedContacts.ownerId, savedContacts.contactUserId],
        });

      return { success: true as const };
    }),

  removeContact: protectedProcedure
    .input(z.object({ contactUserId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(savedContacts)
        .where(
          and(
            eq(savedContacts.ownerId, ctx.session.user.id),
            eq(savedContacts.contactUserId, input.contactUserId)
          )
        );
      return { success: true as const };
    }),
});
