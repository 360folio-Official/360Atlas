// Where to find the database. Two ways to set it:
//   DATABASE_URL=mysql://user:password@127.0.0.1:3306/name   (local .env.local)
//   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME (and optional DB_PORT)
//     - what Hostinger adds when it creates a database for the web app.
// DATABASE_URL wins when both are set.

export type DbCredentials =
  | { uri: string }
  | { host: string; port: number; user: string; password: string; database: string };

export function dbCredentials(env: NodeJS.ProcessEnv = process.env): DbCredentials {
  if (env.DATABASE_URL) return { uri: env.DATABASE_URL };
  return {
    // "localhost" can resolve to the IPv6 address ::1, which Hostinger's
    // database refuses, so always use the IPv4 address instead.
    host: !env.DB_HOST || env.DB_HOST === "localhost" ? "127.0.0.1" : env.DB_HOST,
    port: Number(env.DB_PORT) || 3306,
    user: env.DB_USER ?? "",
    password: env.DB_PASSWORD ?? "",
    database: env.DB_NAME ?? "",
  };
}
