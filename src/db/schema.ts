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
]);

export const userStatusEnum = pgEnum("user_status", ["ACTIVO", "CONGELADO"]);

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

export const users = pgTable("TUMIN_users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email").unique(),
  nip: text("nip").notNull(), // Hashed
  region: text("region").notNull(),
  role: userRoleEnum("role").default("SOCIO").notNull(),
  referrerId: text("referrer_id"), // Self-reference
  status: userStatusEnum("status").default("ACTIVO").notNull(),
  duplicatorBonus: doublePrecision("duplicator_bonus").default(0).notNull(),
  firstSaleOk: boolean("first_sale_ok").default(false).notNull(),
  productOk: boolean("product_ok").default(false).notNull(),
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
}));

export const transactions = pgTable("TUMIN_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromId: text("from_id").references(() => users.id).notNull(),
  toId: text("to_id").references(() => users.id).notNull(),
  amount: doublePrecision("amount").notNull(),
  concept: text("concept").notNull(),
  type: transactionTypeEnum("type").notNull(),
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
  priceMxn: doublePrecision("price_mxn").notNull(),
  priceTumin: doublePrecision("price_tumin").notNull(),
  categories: jsonb("categories").$type<string[]>().notNull(),
  region: text("region").notNull(),
  status: productStatusEnum("status").default("ACTIVO").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one }) => ({
  seller: one(users, {
    fields: [products.sellerId],
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
