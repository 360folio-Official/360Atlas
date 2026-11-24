import { defineConfig } from "drizzle-kit";
import { dbCredentials } from "./src/db/connection";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Fall back to variables already in the environment.
}

const credentials = dbCredentials();

export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema.ts",
  out: "./db/migrations",
  dbCredentials: "uri" in credentials ? { url: credentials.uri } : credentials,
});
