import { PrismaClient } from "@prisma/client";
import translatedExtension from "../../database/prisma/translationExtension";

/**
 * Prisma client without zenstack access policies, allowing for unrestricted access to the database.
 */
const authorizedPrismaClient = new PrismaClient().$extends(
	translatedExtension("sv"),
);

export default authorizedPrismaClient;
