import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "node:path";

const dbPath = path.resolve(process.cwd(), "db", "data.sqlite");

const adapter = new PrismaLibSql({ url: `file:${dbPath}` });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
