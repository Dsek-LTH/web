import { PrismaClient } from "@prisma/client";

/**
 * Prisma client without zenstack access policies, allowing for unrestricted access to the database.
 */
const authorizedPrismaClient = new PrismaClient();

export default authorizedPrismaClient;
