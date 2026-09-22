import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { contactMethods, users } from "@/db/schema";
import {
  sortContactMethodsByPriority,
  type ContactChannelId,
  type PublicContactMethod,
} from "@/lib/contact-links";

/** Load contact methods that are safe to expose publicly for the given user IDs. */
export async function loadPublicContactMethods(
  userIds: string[]
): Promise<Map<string, PublicContactMethod[]>> {
  const map = new Map<string, PublicContactMethod[]>();
  if (userIds.length === 0) return map;

  const rows = await db
    .select({
      id: contactMethods.id,
      userId: contactMethods.userId,
      channel: contactMethods.channel,
      value: contactMethods.value,
      label: contactMethods.label,
      sortOrder: contactMethods.sortOrder,
      showContactMethods: users.showContactMethods,
      publicProfile: users.publicProfile,
    })
    .from(contactMethods)
    .innerJoin(users, eq(contactMethods.userId, users.id))
    .where(
      and(
        inArray(contactMethods.userId, userIds),
        eq(contactMethods.isEnabled, true),
        eq(contactMethods.isPublic, true),
        eq(users.showContactMethods, true),
        eq(users.publicProfile, true)
      )
    )
    .orderBy(asc(contactMethods.sortOrder));

  for (const row of rows) {
    const list = map.get(row.userId) ?? [];
    list.push({
      id: row.id,
      channel: row.channel as ContactChannelId,
      value: row.value,
      label: row.label,
      sortOrder: row.sortOrder,
    });
    map.set(row.userId, list);
  }

  for (const [uid, list] of map) {
    map.set(uid, sortContactMethodsByPriority(list));
  }

  return map;
}

export async function loadMyContactMethods(userId: string) {
  return db
    .select()
    .from(contactMethods)
    .where(eq(contactMethods.userId, userId))
    .orderBy(asc(contactMethods.sortOrder), asc(contactMethods.createdAt));
}
