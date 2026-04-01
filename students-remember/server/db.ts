import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  teams,
  teamMembers,
  students,
  groups,
  groupingSuggestions,
  type Team,
  type TeamMember,
  type Student,
  type Group,
  type GroupingSuggestion,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Team queries
export async function createTeam(
  name: string,
  description: string | undefined,
  createdById: number
): Promise<Team> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(teams).values({
    name,
    description,
    createdById,
  });

  const teamId = result[0].insertId as number;
  const team = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  return team[0]!;
}

export async function getTeamById(teamId: number): Promise<Team | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserTeams(userId: number): Promise<Team[]> {
  const db = await getDb();
  if (!db) return [];

  const memberTeams = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));

  if (memberTeams.length === 0) return [];

  const teamIds = memberTeams.map((m) => m.teamId);
  const result = await db
    .select()
    .from(teams)
    .where(
      and(
        ...teamIds.map((id) => eq(teams.id, id))
      ) as any
    );

  return result;
}

// Team member queries
export async function addTeamMember(
  teamId: number,
  userId: number,
  role: "admin" | "member" = "member"
): Promise<TeamMember> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(teamMembers).values({
    teamId,
    userId,
    role,
  });

  const memberId = result[0].insertId as number;
  const member = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.id, memberId))
    .limit(1);

  return member[0]!;
}

export async function getTeamMembers(teamId: number): Promise<TeamMember[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));
}

export async function isTeamMember(
  teamId: number,
  userId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1);

  return result.length > 0;
}

// Student queries
export async function createStudent(
  teamId: number,
  name: string,
  photoUrl?: string,
  photoKey?: string,
  personalityData?: Record<string, number>,
  notes?: string
): Promise<Student> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(students).values({
    teamId,
    name,
    photoUrl,
    photoKey,
    personalityData,
    notes,
  });

  const studentId = result[0].insertId as number;
  const student = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  return student[0]!;
}

export async function getStudentById(studentId: number): Promise<Student | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getTeamStudents(teamId: number): Promise<Student[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(students)
    .where(eq(students.teamId, teamId));
}

export async function updateStudent(
  studentId: number,
  updates: Partial<Omit<Student, "id" | "teamId" | "createdAt">>
): Promise<Student | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(students).set(updates).where(eq(students.id, studentId));

  return await getStudentById(studentId);
}

export async function deleteStudent(studentId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(students).where(eq(students.id, studentId));
}

// Group queries
export async function createGroup(
  teamId: number,
  name: string,
  createdById: number,
  studentIds: number[],
  description?: string
): Promise<Group> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(groups).values({
    teamId,
    name,
    description,
    createdById,
    studentIds,
  });

  const groupId = result[0].insertId as number;
  const group = await db
    .select()
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  return group[0]!;
}

export async function getTeamGroups(teamId: number): Promise<Group[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(groups)
    .where(eq(groups.teamId, teamId));
}

export async function deleteGroup(groupId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(groups).where(eq(groups.id, groupId));
}

// Grouping suggestion queries
export async function createGroupingSuggestion(
  teamId: number,
  createdById: number,
  groupSize: number,
  suggestions: Array<{
    groupName: string;
    studentIds: number[];
    reasoning: string;
  }>
): Promise<GroupingSuggestion> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(groupingSuggestions).values({
    teamId,
    createdById,
    groupSize,
    suggestions,
  });

  const suggestionId = result[0].insertId as number;
  const suggestion = await db
    .select()
    .from(groupingSuggestions)
    .where(eq(groupingSuggestions.id, suggestionId))
    .limit(1);

  return suggestion[0]!;
}

export async function getTeamGroupingSuggestions(
  teamId: number
): Promise<GroupingSuggestion[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(groupingSuggestions)
    .where(eq(groupingSuggestions.teamId, teamId));
}
