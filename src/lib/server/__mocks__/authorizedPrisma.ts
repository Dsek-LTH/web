import { PrismaClient } from "@prisma/client";
import { beforeEach } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";

beforeEach(() => {
  mockReset(authorizedPrismaClient);
});

const authorizedPrismaClient = mockDeep<PrismaClient>();

export default authorizedPrismaClient;
