/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS diagnostic. */
const { Client } = require("pg");
require("dotenv").config({ quiet: true });

const required = {
  users: ["id", "email", "name", "role", "doctor_access_requested", "password_hash", "subscription", "medical_history", "created_at"],
  predictions: ["id", "user_id", "symptoms", "results", "recommended_test", "created_at"],
  reports: ["id", "user_id", "file_url", "report_type", "cnn_label", "cnn_confidence", "status", "doctor_notes", "doctor_id"],
  consultations: ["id", "patient_id", "doctor_id", "status", "prescription", "created_at"],
  messages: ["id", "consultation_id", "sender_id", "content", "created_at"],
};

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL in frontend/.env first.");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    application_name: "medai_connection_check",
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
  });
  try {
    await client.connect();
    await client.query("BEGIN READ ONLY");
    const { rows } = await client.query(
      "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ANY($1::text[])",
      [Object.keys(required)],
    );
    const missing = Object.entries(required).flatMap(([table, columns]) =>
      columns.filter(column => !rows.some(row => row.table_name === table && row.column_name === column))
        .map(column => `${table}.${column}`),
    );
    await client.query("ROLLBACK");
    console.log("Supabase database connection OK. No records were changed.");
    if (missing.length) {
      console.error("The database is missing fields required by MedAI:", missing.join(", "));
      console.error("Review the Prisma schema against this database before applying any schema changes.");
      process.exitCode = 1;
    } else console.log("All five MedAI tables contain the required columns.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/tenant(?:\/| or )user|tenant.*not found/i.test(message)) {
      console.error("Supabase could not match the configured pooler host and username to a project.");
      console.error("Copy the Session pooler connection string from your project's Connect panel into frontend/.env. Replace only the password placeholder.");
    } else if (error.code === "28P01") {
      console.error("The database rejected the credentials. Check the connection string from Supabase's Connect panel.");
    } else if (["ENOTFOUND", "EAI_AGAIN"].includes(error.code)) {
      console.error("The database hostname could not be resolved. Check the hostname and network access.");
    } else console.error(`Database check failed (${error.code || error.name || "unknown error"}). Check project availability and connection settings.`);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
