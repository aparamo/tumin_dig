import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  doublePrecision,
  boolean,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "SOCIO",
  "COORDINADOR_LOCAL",
  "COORDINADOR",
  "COORDINADOR_GENERAL",
]);

export const userStatusEnum = pgEnum("user_status", ["ACTIVO", "CONGELADO"]);

export const adStatusEnum = pgEnum("ad_status", ["PENDIENTE", "ACTIVO", "INACTIVO"]);

export const accountTierEnum = pgEnum("account_tier", [
  "NORMAL",
  "PAGO",
  "PATROCINADOR",
  "FINANCIADOR",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "TRANSFERENCIA",
  "BONO",
  "MINADO",
  "PAGO_TRABAJO",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "PENDIENTE",
  "PAGADO",
  "RECHAZADO",
]);

export const productStatusEnum = pgEnum("product_status", ["ACTIVO", "INACTIVO"]);

export const passwordResetChannelEnum = pgEnum("password_reset_channel", ["EMAIL"]);

export const users = pgTable("TUMIN_users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email").unique(),
  nip: text("nip").notNull(), // Hashed
  /** Community enrollment / adscripción region — used for coordinator jurisdiction */
  region: text("region").notNull(),
  enrollmentMethod: text("enrollment_method").default("REGION").notNull(),
  enrollmentMethodOther: text("enrollment_method_other"),
  residenceCountry: text("residence_country"),
  residenceState: text("residence_state"),
  residenceCity: text("residence_city"),
  residencePostalCode: text("residence_postal_code"),
  role: userRoleEnum("role").default("SOCIO").notNull(),
  referrerId: text("referrer_id"), // Self-reference
  status: userStatusEnum("status").default("ACTIVO").notNull(),
  accountTier: accountTierEnum("account_tier").default("NORMAL").notNull(),
  avatarUrl: text("avatar_url"),
  /** Optional name shown on public profile / bazar instead of legal name */
  publicName: text("public_name"),
  bio: text("bio"),
  /** Whether `/u/[id]` and public APIs expose this user — privacy-first: off by default */
  publicProfile: boolean("public_profile").default(false).notNull(),
  /** Phone is hidden by default; users can opt-in to show it on their public profile/bazar */
  showPhone: boolean("show_phone").default(false).notNull(),
  showEmail: boolean("show_email").default(false).notNull(),
  showRegion: boolean("show_region").default(true).notNull(),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  duplicatorBonus: doublePrecision("duplicator_bonus").default(0).notNull(),
  firstSaleOk: boolean("first_sale_ok").default(false).notNull(),
  productOk: boolean("product_ok").default(false).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  referrer: one(users, {
    fields: [users.referrerId],
    references: [users.id],
    relationName: "referrals",
  }),
  referrees: many(users, { relationName: "referrals" }),
  sentTransactions: many(transactions, { relationName: "sender" }),
  receivedTransactions: many(transactions, { relationName: "receiver" }),
  products: many(products),
  requestedJobs: many(jobs, { relationName: "requester" }),
  verifiedJobs: many(jobs, { relationName: "verifier" }),
  votedRatings: many(ratings, { relationName: "voter" }),
  receivedRatings: many(ratings, { relationName: "seller" }),
  miningHistory: many(dailyMining),
  media: many(media),
  ads: many(ads),
  passwordResets: many(passwordResets),
}));

export const passwordResets = pgTable("TUMIN_password_resets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  channel: passwordResetChannelEnum("channel").notNull(),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, {
    fields: [passwordResets.userId],
    references: [users.id],
  }),
}));

export const transactions = pgTable("TUMIN_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromId: text("from_id").references(() => users.id).notNull(),
  toId: text("to_id").references(() => users.id).notNull(),
  amount: doublePrecision("amount").notNull(),
  concept: text("concept").notNull(),
  type: transactionTypeEnum("type").notNull(),
  /** Client-generated UUID for idempotency — prevents duplicate payments on retry/double-submit */
  idempotencyKey: text("idempotency_key").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  from: one(users, {
    fields: [transactions.fromId],
    references: [users.id],
    relationName: "sender",
  }),
  to: one(users, {
    fields: [transactions.toId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const products = pgTable("TUMIN_products", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: text("seller_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  /** Optional; null or empty means no public description */
  description: text("description"),
  extraInfo: text("extra_info"),
  priceMxn: doublePrecision("price_mxn").notNull(),
  priceTumin: doublePrecision("price_tumin").notNull(),
  categories: jsonb("categories").$type<string[]>().notNull(),
  region: text("region").notNull(),
  status: productStatusEnum("status").default("ACTIVO").notNull(),
  /** When false, product is hidden from bazar and public profile (still manageable as seller) */
  showInProfile: boolean("show_in_profile").default(true).notNull(),
  imageUrl: text("image_url"),
  imgUrls: jsonb("img_urls").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productComments = pgTable("TUMIN_product_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  authorId: text("author_id")
    .references(() => users.id)
    .notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(users, {
    fields: [products.sellerId],
    references: [users.id],
  }),
  comments: many(productComments),
}));

export const productCommentsRelations = relations(productComments, ({ one }) => ({
  product: one(products, {
    fields: [productComments.productId],
    references: [products.id],
  }),
  author: one(users, {
    fields: [productComments.authorId],
    references: [users.id],
  }),
}));

export const jobs = pgTable("TUMIN_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  requesterId: text("requester_id").references(() => users.id).notNull(),
  verifierId: text("verifier_id").references(() => users.id),
  description: text("description").notNull(),
  minutes: integer("minutes").notNull(),
  amount: doublePrecision("amount").notNull(),
  status: jobStatusEnum("status").default("PENDIENTE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobsRelations = relations(jobs, ({ one }) => ({
  requester: one(users, {
    fields: [jobs.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  verifier: one(users, {
    fields: [jobs.verifierId],
    references: [users.id],
    relationName: "verifier",
  }),
}));

export const ratings = pgTable("TUMIN_ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  voterId: text("voter_id").references(() => users.id).notNull(),
  sellerId: text("seller_id").references(() => users.id).notNull(),
  stars: integer("stars").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ratingsRelations = relations(ratings, ({ one }) => ({
  voter: one(users, {
    fields: [ratings.voterId],
    references: [users.id],
    relationName: "voter",
  }),
  seller: one(users, {
    fields: [ratings.sellerId],
    references: [users.id],
    relationName: "seller",
  }),
}));

export const dailyMining = pgTable("TUMIN_daily_mining", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  streak: integer("streak").notNull(),
  amount: doublePrecision("amount").notNull(),
});

export const dailyMiningRelations = relations(dailyMining, ({ one }) => ({
  user: one(users, {
    fields: [dailyMining.userId],
    references: [users.id],
  }),
}));

export const mediaTypeEnum = pgEnum("media_type", ["IMAGE", "VIDEO", "LINK"]);

export const media = pgTable("TUMIN_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id).notNull(),
  url: text("url").notNull(),
  name: text("name").notNull(),
  sizeBytes: integer("size_bytes").default(0).notNull(),
  type: mediaTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mediaRelations = relations(media, ({ one }) => ({
  user: one(users, {
    fields: [media.userId],
    references: [users.id],
  }),
}));

export const ads = pgTable("TUMIN_ads", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id).notNull(),
  imageUrl: text("image_url").notNull(),
  status: adStatusEnum("status").default("PENDIENTE").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adsRelations = relations(ads, ({ one }) => ({
  user: one(users, {
    fields: [ads.userId],
    references: [users.id],
  }),
}));
