import { defineConfig } from "drizzle-kit"

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error("Missing TURSO_DATABASE_URL")
}

export default defineConfig({
  schema: "./app/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
  strict: true,
  verbose: true,
})
