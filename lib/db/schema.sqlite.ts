import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("STUDENT"),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  banned: integer("banned", { mode: "boolean" }).default(false),
  xp: integer("xp").default(0),
  streak: integer("streak").default(0),
  lastActiveAt: integer("last_active_at", { mode: "timestamp" }),
  publicSlug: text("public_slug"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
});

export const roles = sqliteTable("roles", {
  name: text("name").primaryKey(),
  level: integer("level").notNull(),
});

export const labs = sqliteTable("labs", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull().default("beginner"),
  category: text("category").notNull().default("general"),
  content: text("content").notNull().default(""),
  published: integer("published", { mode: "boolean" }).default(false),
  xpReward: integer("xp_reward").default(100),
  authorId: text("author_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const labSteps = sqliteTable("lab_steps", {
  id: text("id").primaryKey(),
  labId: text("lab_id").notNull().references(() => labs.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  instruction: text("instruction").notNull(),
  expectedOutput: text("expected_output"),
  xpReward: integer("xp_reward").default(10),
});

export const challenges = sqliteTable("challenges", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("misc"),
  difficulty: text("difficulty").notNull().default("easy"),
  points: integer("points").default(100),
  flagHash: text("flag_hash").notNull(),
  published: integer("published", { mode: "boolean" }).default(false),
  authorId: text("author_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  challengeId: text("challenge_id").notNull().references(() => challenges.id),
  correct: integer("correct", { mode: "boolean" }).notNull(),
  submittedAt: integer("submitted_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const hints = sqliteTable("hints", {
  id: text("id").primaryKey(),
  challengeId: text("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  content: text("content").notNull(),
  costXp: integer("cost_xp").default(10),
});

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  published: integer("published", { mode: "boolean" }).default(false),
  authorId: text("author_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const modules = sqliteTable("modules", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  title: text("title").notNull(),
});

export const lessons = sqliteTable("lessons", {
  id: text("id").primaryKey(),
  moduleId: text("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  xpReward: integer("xp_reward").default(25),
});

export const roadmaps = sqliteTable("roadmaps", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  published: integer("published", { mode: "boolean" }).default(false),
});

export const roadmapNodes = sqliteTable("roadmap_nodes", {
  id: text("id").primaryKey(),
  roadmapId: text("roadmap_id").notNull().references(() => roadmaps.id, { onDelete: "cascade" }),
  parentId: text("parent_id"),
  title: text("title").notNull(),
  description: text("description"),
  resourceUrl: text("resource_url"),
  order: integer("order").default(0),
});

export const tools = sqliteTable("tools", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull().default("general"),
  description: text("description").notNull(),
  url: text("url"),
  tags: text("tags").default("[]"),
});

export const writeups = sqliteTable("writeups", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  authorId: text("author_id").references(() => users.id),
  published: integer("published", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  writeupId: text("writeup_id").references(() => writeups.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const votes = sqliteTable("votes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  value: integer("value").notNull(),
});

export const bookmarks = sqliteTable("bookmarks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  content: text("content").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const teamMembers = sqliteTable("team_members", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role").default("member"),
});

export const badges = sqliteTable("badges", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").default("🏆"),
});

export const userBadges = sqliteTable("user_badges", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  badgeId: text("badge_id").notNull().references(() => badges.id),
  awardedAt: integer("awarded_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const xpEvents = sqliteTable("xp_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const links = sqliteTable("links", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  destinationUrl: text("destination_url").notNull(),
  redirectType: integer("redirect_type").default(302),
  active: integer("active", { mode: "boolean" }).default(true),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  maxClicks: integer("max_clicks"),
  clickCount: integer("click_count").default(0),
  passwordHash: text("password_hash"),
  tags: text("tags").default("[]"),
  notes: text("notes"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  interstitial: integer("interstitial", { mode: "boolean" }).default(false),
  createdById: text("created_by_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const linkClicks = sqliteTable("link_clicks", {
  id: text("id").primaryKey(),
  linkId: text("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),
  ipHash: text("ip_hash").notNull(),
  country: text("country"),
  region: text("region"),
  city: text("city"),
  device: text("device"),
  browser: text("browser"),
  os: text("os"),
  referrer: text("referrer"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const linkPasswords = sqliteTable("link_passwords", {
  linkId: text("link_id").primaryKey().references(() => links.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
});

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  diff: text("diff"),
  ip: text("ip"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const invites = sqliteTable("invites", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  role: text("role").default("STUDENT"),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  createdById: text("created_by_id").references(() => users.id),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: integer("read", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
});
