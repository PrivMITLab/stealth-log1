import { pgTable, text, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("STUDENT"),
  emailVerified: boolean("email_verified").default(false),
  banned: boolean("banned").default(false),
  xp: integer("xp").default(0),
  streak: integer("streak").default(0),
  lastActiveAt: timestamp("last_active_at"),
  publicSlug: text("public_slug"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
});

export const roles = pgTable("roles", {
  name: text("name").primaryKey(),
  level: integer("level").notNull(),
});

export const labs = pgTable("labs", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull().default("beginner"),
  category: text("category").notNull().default("general"),
  content: text("content").notNull().default(""),
  published: boolean("published").default(false),
  xpReward: integer("xp_reward").default(100),
  authorId: text("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const labSteps = pgTable("lab_steps", {
  id: text("id").primaryKey(),
  labId: text("lab_id").notNull().references(() => labs.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  instruction: text("instruction").notNull(),
  expectedOutput: text("expected_output"),
  xpReward: integer("xp_reward").default(10),
});

export const challenges = pgTable("challenges", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("misc"),
  difficulty: text("difficulty").notNull().default("easy"),
  points: integer("points").default(100),
  flagHash: text("flag_hash").notNull(),
  published: boolean("published").default(false),
  authorId: text("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const submissions = pgTable("submissions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  challengeId: text("challenge_id").notNull().references(() => challenges.id),
  correct: boolean("correct").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const hints = pgTable("hints", {
  id: text("id").primaryKey(),
  challengeId: text("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  content: text("content").notNull(),
  costXp: integer("cost_xp").default(10),
});

export const courses = pgTable("courses", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  published: boolean("published").default(false),
  authorId: text("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const modules = pgTable("modules", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  title: text("title").notNull(),
});

export const lessons = pgTable("lessons", {
  id: text("id").primaryKey(),
  moduleId: text("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  xpReward: integer("xp_reward").default(25),
});

export const roadmaps = pgTable("roadmaps", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  published: boolean("published").default(false),
});

export const roadmapNodes = pgTable("roadmap_nodes", {
  id: text("id").primaryKey(),
  roadmapId: text("roadmap_id").notNull().references(() => roadmaps.id, { onDelete: "cascade" }),
  parentId: text("parent_id"),
  title: text("title").notNull(),
  description: text("description"),
  resourceUrl: text("resource_url"),
  order: integer("order").default(0),
});

export const tools = pgTable("tools", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull().default("general"),
  description: text("description").notNull(),
  url: text("url"),
  tags: text("tags").default("[]"),
});

export const writeups = pgTable("writeups", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  authorId: text("author_id").references(() => users.id),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: text("id").primaryKey(),
  writeupId: text("writeup_id").references(() => writeups.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const votes = pgTable("votes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  value: integer("value").notNull(),
});

export const bookmarks = pgTable("bookmarks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teams = pgTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role").default("member"),
});

export const badges = pgTable("badges", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").default("🏆"),
});

export const userBadges = pgTable("user_badges", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  badgeId: text("badge_id").notNull().references(() => badges.id),
  awardedAt: timestamp("awarded_at").defaultNow(),
});

export const xpEvents = pgTable("xp_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const links = pgTable("links", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  destinationUrl: text("destination_url").notNull(),
  redirectType: integer("redirect_type").default(302),
  active: boolean("active").default(true),
  expiresAt: timestamp("expires_at"),
  maxClicks: integer("max_clicks"),
  clickCount: integer("click_count").default(0),
  passwordHash: text("password_hash"),
  tags: text("tags").default("[]"),
  notes: text("notes"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  interstitial: boolean("interstitial").default(false),
  createdById: text("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const linkClicks = pgTable("link_clicks", {
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const linkPasswords = pgTable("link_passwords", {
  linkId: text("link_id").primaryKey().references(() => links.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
});

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  diff: text("diff"),
  ip: text("ip"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invites = pgTable("invites", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  role: text("role").default("STUDENT"),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdById: text("created_by_id").references(() => users.id),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
});
