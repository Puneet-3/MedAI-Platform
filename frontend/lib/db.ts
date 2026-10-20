import { Prisma, PrismaClient } from "@/app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaSchema?: string };
const schema = JSON.stringify(Prisma.dmmf.datamodel.models);
function createClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: process.env.VERCEL ? 3 : 10, connectionTimeoutMillis: 10000, idleTimeoutMillis: 20000 });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}
// Refresh the development client when generated model fields change.
export const db = globalForPrisma.prismaSchema === schema && globalForPrisma.prisma ? globalForPrisma.prisma : createClient();
if (process.env.NODE_ENV !== "production") {
  const previous = globalForPrisma.prisma;
  globalForPrisma.prisma = db;
  globalForPrisma.prismaSchema = schema;
  if (previous && previous !== db) void previous.$disconnect().catch(() => {});
}
