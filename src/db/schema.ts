import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// Usuarios + perfiles estilo LinkedIn/Facebook
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("viajero"), // viajero | anfitrion | admin
  plan: varchar("plan", { length: 20 }).notNull().default("gratuito"), // gratuito | corporativo | premium
  avatar: text("avatar"),
  cover: text("cover"),
  bio: text("bio"),
  city: varchar("city", { length: 100 }),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

// Alojamientos (reservas noche + subarriendos mes)
export const listings = pgTable(
  "listings",
  {
    id: text("id").primaryKey(),
    hostId: text("host_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 140 }).notNull(),
    description: text("description").notNull(),
    type: varchar("type", { length: 20 }).notNull().default("reserva"), // reserva | subarriendo
    category: varchar("category", { length: 40 }).notNull().default("hostel"),
    city: varchar("city", { length: 100 }).notNull(),
    address: varchar("address", { length: 240 }).notNull().default(""),
    priceNight: numeric("price_night", { precision: 10, scale: 2 }).notNull().default("0"),
    priceMonth: numeric("price_month", { precision: 10, scale: 2 }),
    images: text("images").notNull().default("[]"), // JSON array
    amenities: text("amenities").notNull().default("[]"),
    policies: text("policies").notNull().default(""),
    maxGuests: integer("max_guests").notNull().default(2),
    rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("4.8"),
    reviews: integer("reviews").notNull().default(0),
    featured: boolean("featured").notNull().default(false),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("listings_city_type_idx").on(table.city, table.type)],
);

export const reservations = pgTable(
  "reservations",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    guestId: text("guest_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    checkIn: timestamp("check_in", { withTimezone: true }).notNull(),
    checkOut: timestamp("check_out", { withTimezone: true }).notNull(),
    guests: integer("guests").notNull().default(1),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
    commission: numeric("commission", { precision: 10, scale: 2 }).notNull(),
    commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).notNull(),
    total: numeric("total", { precision: 10, scale: 2 }).notNull(),
    status: varchar("status", { length: 30 }).notNull().default("confirmada"),
    aiChecked: boolean("ai_checked").notNull().default(false),
    aiResult: text("ai_result"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("reservations_listing_idx").on(table.listingId)],
);

// Cuentas externas para la IA (booking / airbnb)
export const channelAccounts = pgTable("channel_accounts", {
  id: text("id").primaryKey(),
  hostId: text("host_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  platform: varchar("platform", { length: 30 }).notNull(), // booking | airbnb | otro
  externalId: varchar("external_id", { length: 120 }).notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }),
});

// Publicidad de proveedores + sponsors
export const ads = pgTable("ads", {
  id: text("id").primaryKey(),
  company: varchar("company", { length: 120 }).notNull(),
  category: varchar("category", { length: 40 }).notNull(), // tecnologia | colchones | higiene | etc
  title: varchar("title", { length: 140 }).notNull(),
  description: text("description").notNull(),
  image: text("image").notNull().default(""),
  url: text("url").notNull().default("#"),
  sponsor: boolean("sponsor").notNull().default(false), // true = fundación sponsor
  active: boolean("active").notNull().default(true),
});
