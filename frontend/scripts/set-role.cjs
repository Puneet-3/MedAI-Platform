/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS administration script. */
const { PrismaClient } = require("../app/generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config({ quiet: true });
async function main() {
  const [email, role] = process.argv.slice(2);
  if (!email || !["USER", "DOCTOR", "ADMIN"].includes(role)) throw new Error("Usage: npm run user:role -- email@example.com USER|DOCTOR|ADMIN");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    await db.user.update({ where: { email: email.trim().toLowerCase() }, data: { role, doctorAccessRequested: false } });
    console.log(`Account role updated to ${role}.`);
  } finally { await db.$disconnect(); await pool.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
