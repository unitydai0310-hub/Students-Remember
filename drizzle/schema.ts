import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  boolean,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 運営チームテーブル
 * 複数の運営チームを管理し、各チームは最大8名のメンバーを持つ
 */
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

/**
 * チームメンバーシップテーブル
 * ユーザーとチームの関連付け
 */
export const teamMembers = mysqlTable("teamMembers", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["admin", "member"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

/**
 * 受講生テーブル
 * 受講生の基本情報と性格データを管理
 */
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  photoUrl: text("photoUrl"), // S3 CDN URL
  photoKey: varchar("photoKey", { length: 512 }), // S3 object key for management
  personalityData: json("personalityData").$type<{
    // 性格特性を複数の軸で管理
    // 例: { "extroversion": 7, "conscientiousness": 8, "agreeableness": 6, ... }
    [key: string]: number;
  }>(),
  notes: text("notes"), // 自由記入欄
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

/**
 * グループテーブル
 * グループ分け結果を保存
 */
export const groups = mysqlTable("groups", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdById: int("createdById").notNull(),
  studentIds: json("studentIds").$type<number[]>(), // グループに属する受講生のID配列
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;

/**
 * グループ分け提案ログテーブル
 * グループ分け提案の履歴を記録
 */
export const groupingSuggestions = mysqlTable("groupingSuggestions", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  createdById: int("createdById").notNull(),
  groupSize: int("groupSize").notNull(), // 1グループあたりの人数
  suggestions: json("suggestions").$type<
    Array<{
      groupName: string;
      studentIds: number[];
      reasoning: string;
    }>
  >(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GroupingSuggestion = typeof groupingSuggestions.$inferSelect;
export type InsertGroupingSuggestion =
  typeof groupingSuggestions.$inferInsert;
