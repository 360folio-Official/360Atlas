import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { account, session, user, verification } from "@/db/schema";

// Sign-in runs inside this app and stores accounts in our own MariaDB.
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    // Turned on once email sending (Hostinger SMTP) is configured.
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: { type: "string", input: false, defaultValue: "member" },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  // Keeps the session cookie in sync when signing in from Server Actions.
  plugins: [nextCookies()],
});
