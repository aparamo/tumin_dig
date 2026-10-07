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
  unique,
  date,
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
  /** @deprecated Prefer contact_methods + showContactMethods; kept for migration/legacy */
  showPhone: boolean("show_phone").default(false).notNull(),
  showEmail: boolean("show_email").default(false).notNull(),
  showRegion: boolean("show_region").default(true).notNull(),
  /** Global gate: when false, no contact methods are exposed publicly */
  showContactMethods: boolean("show_contact_methods").default(false).notNull(),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  duplicatorBonus: doublePrecision("duplicator_bonus").default(0).notNull(),
  firstSaleOk: boolean("first_sale_ok").default(false).notNull(),
  productOk: boolean("product_ok").default(false).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  /** Receive automated DM when someone buys your product (default on) */
  autoMessagePurchase: boolean("auto_message_purchase").default(true).notNull(),
  /** Receive automated DM when someone transfers Túmin to you (default on) */
  autoMessageTransfer: boolean("auto_message_transfer").default(true).notNull(),
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
  inviteTokens: many(inviteTokens),
  savedContactsOwned: many(savedContacts, { relationName: "savedContactsOwner" }),
  savedAsContact: many(savedContacts, { relationName: "savedAsContact" }),
  contactMethods: many(contactMethods),
  conversationsAsA: many(conversations, { relationName: "conversationUserA" }),
  conversationsAsB: many(conversations, { relationName: "conversationUserB" }),
  sentMessages: many(messages),
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

/** Snapshot of product at purchase time (survives later edits/deletes) */
export type ProductPurchaseSnapshot = {
  name: string;
  priceMxn: number;
  priceTumin: number;
  imageUrl?: string | null;
};

export const transactions = pgTable("TUMIN_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromId: text("from_id").references(() => users.id).notNull(),
  toId: text("to_id").references(() => users.id).notNull(),
  amount: doublePrecision("amount").notNull(),
  concept: text("concept").notNull(),
  type: transactionTypeEnum("type").notNull(),
  /** Set when payment is a bazar product purchase */
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  productSnapshot: jsonb("product_snapshot").$type<ProductPurchaseSnapshot>(),
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
  product: one(products, {
    fields: [transactions.productId],
    references: [products.id],
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
  /** Featured / “estrella” product highlighted in directory and profile (max 5 per seller) */
  isStarred: boolean("is_starred").default(false).notNull(),
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
  purchases: many(transactions),
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

export const jobVoteStanceEnum = pgEnum("job_vote_stance", ["ACUERDO", "DESACUERDO"]);

export const jobDisputeStatusEnum = pgEnum("job_dispute_status", ["ABIERTA", "RESUELTA"]);

export const jobVotes = pgTable(
  "TUMIN_job_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .references(() => jobs.id, { onDelete: "cascade" })
      .notNull(),
    voterId: text("voter_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    stance: jobVoteStanceEnum("stance").notNull(),
    message: text("message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique("job_votes_job_voter_uid").on(t.jobId, t.voterId)]
);

export const jobDisputes = pgTable(
  "TUMIN_job_disputes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .references(() => jobs.id, { onDelete: "cascade" })
      .notNull(),
    status: jobDisputeStatusEnum("status").default("ABIERTA").notNull(),
    openedById: text("opened_by_id")
      .references(() => users.id)
      .notNull(),
    resolvedById: text("resolved_by_id").references(() => users.id),
    resolutionNote: text("resolution_note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at"),
  },
  (t) => [unique("job_disputes_job_uid").on(t.jobId)]
);

export const jobDisputeFlags = pgTable(
  "TUMIN_job_dispute_flags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    disputeId: uuid("dispute_id")
      .references(() => jobDisputes.id, { onDelete: "cascade" })
      .notNull(),
    coordinatorId: text("coordinator_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    withdrawnAt: timestamp("withdrawn_at"),
  },
  (t) => [unique("job_dispute_flags_dispute_coord_uid").on(t.disputeId, t.coordinatorId)]
);

export const jobDisputeMessages = pgTable("TUMIN_job_dispute_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  disputeId: uuid("dispute_id")
    .references(() => jobDisputes.id, { onDelete: "cascade" })
    .notNull(),
  authorId: text("author_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobsRelations = relations(jobs, ({ one, many }) => ({
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
  votes: many(jobVotes),
  dispute: one(jobDisputes),
}));

export const jobVotesRelations = relations(jobVotes, ({ one }) => ({
  job: one(jobs, {
    fields: [jobVotes.jobId],
    references: [jobs.id],
  }),
  voter: one(users, {
    fields: [jobVotes.voterId],
    references: [users.id],
  }),
}));

export const jobDisputesRelations = relations(jobDisputes, ({ one, many }) => ({
  job: one(jobs, {
    fields: [jobDisputes.jobId],
    references: [jobs.id],
  }),
  openedBy: one(users, {
    fields: [jobDisputes.openedById],
    references: [users.id],
    relationName: "disputeOpenedBy",
  }),
  resolvedBy: one(users, {
    fields: [jobDisputes.resolvedById],
    references: [users.id],
    relationName: "disputeResolvedBy",
  }),
  flags: many(jobDisputeFlags),
  messages: many(jobDisputeMessages),
}));

export const jobDisputeFlagsRelations = relations(jobDisputeFlags, ({ one }) => ({
  dispute: one(jobDisputes, {
    fields: [jobDisputeFlags.disputeId],
    references: [jobDisputes.id],
  }),
  coordinator: one(users, {
    fields: [jobDisputeFlags.coordinatorId],
    references: [users.id],
  }),
}));

export const jobDisputeMessagesRelations = relations(jobDisputeMessages, ({ one }) => ({
  dispute: one(jobDisputes, {
    fields: [jobDisputeMessages.disputeId],
    references: [jobDisputes.id],
  }),
  author: one(users, {
    fields: [jobDisputeMessages.authorId],
    references: [users.id],
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

export const dailyMining = pgTable(
  "TUMIN_daily_mining",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => users.id).notNull(),
    claimedAt: timestamp("claimed_at", { withTimezone: true }).notNull(),
    minedOn: date("mined_on", { mode: "string" }).notNull(),
    streak: integer("streak").notNull(),
    amount: doublePrecision("amount").notNull(),
  },
  (t) => [unique("daily_mining_user_day").on(t.userId, t.minedOn)]
);

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
  productId: uuid("product_id").references(() => products.id),
  imageUrl: text("image_url").notNull(),
  description: text("description"),
  /** GENERAL = visible network-wide; otherwise matches viewer enrollment region */
  targetRegion: text("target_region").default("GENERAL").notNull(),
  requestedUntil: timestamp("requested_until"),
  status: adStatusEnum("status").default("PENDIENTE").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adsRelations = relations(ads, ({ one }) => ({
  user: one(users, {
    fields: [ads.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [ads.productId],
    references: [products.id],
  }),
}));

export const adminActionEnum = pgEnum("admin_action", [
  "FREEZE",
  "UNFREEZE",
  "VERIFY_IDENTITY",
  "UNVERIFY_IDENTITY",
  "VERIFY_JOB",
  "REJECT_JOB",
  "APPROVE_AD",
  "REJECT_AD",
  "CREATE_SMART_AD",
  "DELETE_SMART_AD",
  "UPDATE_ROLE",
  "DEACTIVATE_PRODUCT",
  "CLAIM_AUDIT_REWARD",
  "VALIDATE_AUDITOR",
  "FLAG_JOB_DISPUTE",
  "RESOLVE_JOB_DISPUTE",
]);

export const adminActionsLog = pgTable("TUMIN_admin_actions_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: text("actor_id")
    .references(() => users.id)
    .notNull(),
  targetUserId: text("target_user_id").references(() => users.id),
  targetProductId: uuid("target_product_id").references(() => products.id),
  targetAdId: uuid("target_ad_id").references(() => ads.id),
  action: adminActionEnum("action").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminActionsLogRelations = relations(adminActionsLog, ({ one }) => ({
  actor: one(users, {
    fields: [adminActionsLog.actorId],
    references: [users.id],
  }),
  targetUser: one(users, {
    fields: [adminActionsLog.targetUserId],
    references: [users.id],
  }),
  targetProduct: one(products, {
    fields: [adminActionsLog.targetProductId],
    references: [products.id],
  }),
  targetAd: one(ads, {
    fields: [adminActionsLog.targetAdId],
    references: [ads.id],
  }),
}));

export const smartAds = pgTable("TUMIN_smart_ads", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  targetRegion: text("target_region"),
  targetState: text("target_state"),
  activeFrom: timestamp("active_from").defaultNow().notNull(),
  activeUntil: timestamp("active_until"),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const smartAdsRelations = relations(smartAds, ({ one }) => ({
  creator: one(users, {
    fields: [smartAds.createdBy],
    references: [users.id],
  }),
}));

export const inviteTokens = pgTable("TUMIN_invite_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inviteTokensRelations = relations(inviteTokens, ({ one }) => ({
  user: one(users, {
    fields: [inviteTokens.userId],
    references: [users.id],
  }),
}));

export const contactChannelEnum = pgEnum("contact_channel", [
  "whatsapp",
  "phone",
  "sms",
  "telegram",
  "signal",
  "mastodon",
  "facebook",
  "instagram",
  "meet",
  "zoom",
  "jitsi",
  "other",
]);

export type ContactChannel = (typeof contactChannelEnum.enumValues)[number];

/** Public contact channels (separate from login phone). Multiple `other` rows allowed; one slot per other channel enforced in app. */
export const contactMethods = pgTable("TUMIN_contact_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  channel: contactChannelEnum("channel").notNull(),
  value: text("value").notNull(),
  label: text("label"),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contactMethodsRelations = relations(contactMethods, ({ one }) => ({
  user: one(users, {
    fields: [contactMethods.userId],
    references: [users.id],
  }),
}));

/** 1:1 DM threads between two users (userAId < userBId lexicographically) */
export const conversations = pgTable(
  "TUMIN_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userAId: text("user_a_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    userBId: text("user_b_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("conversations_user_pair_uid").on(t.userAId, t.userBId)]
);

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  userA: one(users, {
    fields: [conversations.userAId],
    references: [users.id],
    relationName: "conversationUserA",
  }),
  userB: one(users, {
    fields: [conversations.userBId],
    references: [users.id],
    relationName: "conversationUserB",
  }),
  messages: many(messages),
}));

export const autoMessageTypeEnum = pgEnum("auto_message_type", [
  "PURCHASE",
  "TRANSFER",
]);

export type AutoMessageType = (typeof autoMessageTypeEnum.enumValues)[number];

export type AutomatedMessageMetadata = {
  productId?: string;
  productName?: string;
  amount?: number;
  priceMxn?: number;
  transactionId?: string;
};

export const messages = pgTable("TUMIN_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .references(() => conversations.id, { onDelete: "cascade" })
    .notNull(),
  senderId: text("sender_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  body: text("body").notNull(),
  isAutomated: boolean("is_automated").default(false).notNull(),
  automatedType: autoMessageTypeEnum("automated_type"),
  metadata: jsonb("metadata").$type<AutomatedMessageMetadata>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

/** User-saved contacts for directory / pagar / bazar (IDs only; PII read live with privacy flags) */
export const savedContacts = pgTable(
  "TUMIN_saved_contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    contactUserId: text("contact_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("saved_contacts_owner_contact_uid").on(t.ownerId, t.contactUserId)]
);

export const savedContactsRelations = relations(savedContacts, ({ one }) => ({
  owner: one(users, {
    fields: [savedContacts.ownerId],
    references: [users.id],
    relationName: "savedContactsOwner",
  }),
  contact: one(users, {
    fields: [savedContacts.contactUserId],
    references: [users.id],
    relationName: "savedAsContact",
  }),
}));
