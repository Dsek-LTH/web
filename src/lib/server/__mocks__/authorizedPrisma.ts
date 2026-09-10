import { PrismaClient } from "@prisma/client";
import { beforeEach } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";

beforeEach(() => {
  mockReset(authorisedPrismaClient);
});

const authorisedPrismaClient = mockDeep<PrismaClient>();

export default authorisedPrismaClient;
