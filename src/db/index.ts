import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import * as schema from "./schema";

const file = path.resolve(process.cwd(), process.env.DATABASE_FILE || "soulsaga.db");

const globalForDb = globalThis as unknown as { __sqlite?: Database.Database };
const sqlite = globalForDb.__sqlite ?? new Database(file);
if (process.env.NODE_ENV !== "production") globalForDb.__sqlite = sqlite;

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { schema };
