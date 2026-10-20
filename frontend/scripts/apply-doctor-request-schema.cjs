/* eslint-disable @typescript-eslint/no-require-imports -- Standalone schema patch. */
const { Client } = require("pg");
const { readFile } = require("node:fs/promises");
const { resolve } = require("node:path");
require("dotenv").config({ quiet: true });

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL first.");
  const sql = await readFile(resolve(__dirname, "../prisma/patches/20261020_doctor_access_requests.sql"), "utf8");
  const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '15s'");
    await client.query(sql);
    const { rows } = await client.query("SELECT data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'doctor_access_requested'");
    if (rows.length !== 1 || rows[0].data_type !== "boolean" || rows[0].is_nullable !== "NO" || rows[0].column_default !== "false") throw new Error("Doctor request column has an unexpected definition; rolling back.");
    await client.query("COMMIT");
    console.log("Doctor access request field is ready. Existing account roles were not changed.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally { await client.end().catch(() => {}); }
}
main().catch(error => { console.error(`Schema patch failed (${error.code || error.name}).`); process.exitCode = 1; });
