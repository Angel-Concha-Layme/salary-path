import { createClient } from "@libsql/client"

function fail(message) {
  console.error(`[db:preflight] ${message}`)
  process.exit(1)
}

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url) {
  fail("Missing TURSO_DATABASE_URL")
}

if (!authToken) {
  fail("Missing TURSO_AUTH_TOKEN")
}

const client = createClient({ url, authToken })

async function main() {
  const tablesResult = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
  )
  const tableNames = tablesResult.rows
    .map((row) => String(row.name))
    .filter(Boolean)

  const hasMigrationsTable = tableNames.includes("__drizzle_migrations")
  const appTables = tableNames.filter(
    (name) => name !== "__drizzle_migrations" && !name.startsWith("sqlite_"),
  )

  if (appTables.length > 0) {
    console.log(`[db:preflight] Found ${appTables.length} application tables. No repair needed.`)
    return
  }

  if (!hasMigrationsTable) {
    console.log("[db:preflight] Database has no application tables and no migration ledger. No repair needed.")
    return
  }

  const rowsResult = await client.execute("SELECT COUNT(*) AS count FROM __drizzle_migrations")
  const migrationRows = Number(rowsResult.rows[0]?.count ?? 0)

  if (migrationRows <= 0) {
    console.log("[db:preflight] Empty DB with empty migration ledger. No repair needed.")
    return
  }

  console.warn(
    `[db:preflight] Database is empty but __drizzle_migrations has ${migrationRows} rows. Dropping ledger to allow full replay.`,
  )
  await client.execute("DROP TABLE __drizzle_migrations")
  console.log("[db:preflight] Dropped __drizzle_migrations.")
}

main()
  .catch((error) => {
    console.error("[db:preflight] Failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await client.close()
  })
