import "server-only";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { dbCredentials } from "./connection";
import * as schema from "./schema";

// One connection pool per server process. In development the module reloads
// on every edit, so the pool is kept on globalThis to avoid leaking connections.
const globalForDb = globalThis as unknown as { atlasPool?: mysql.Pool };

const pool =
  globalForDb.atlasPool ??
  mysql.createPool({
    ...dbCredentials(),
    connectionLimit: 5,
    // MariaDB returns DECIMAL as strings by default; Drizzle maps them to numbers.
    timezone: "Z",
  });

if (process.env.NODE_ENV !== "production") globalForDb.atlasPool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
export { schema };
