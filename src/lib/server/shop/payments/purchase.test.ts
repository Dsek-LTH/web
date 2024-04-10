import { addTicketToCart } from "$lib/server/shop/addToCart/addToCart";
import purchaseCart, {
  transactionFee,
} from "$lib/server/shop/payments/purchase";
import { PrismaClient } from "@prisma/client";
import { enhance } from "@zenstackhq/runtime";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { getAccessPolicies } from "../../../../hooks.server.helpers";
import {
  MOCK_ACTIVE_TICKET,
  addMockTickets,
  addMockUsers,
  removeAllTestData,
  removeMockTickets,
  removeMockUsers,
  type MockTickets,
} from "../mock";
import { dbIdentification, type ShopIdentification } from "../types";

const mockFns = vi.hoisted(() => ({
  customers: {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    del: vi.fn(),
  },
  paymentIntents: {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
  },
}));

/* eslint-disable @typescript-eslint/no-explicit-any -- For mocking*/
vi.mock("./stripe", () => ({
  default: {
    customers: {
      create: (...args: any) => mockFns.customers.create(...args) as unknown,
      retrieve: (...args: any) =>
        mockFns.customers.retrieve(...args) as unknown,
      update: (...args: any) => mockFns.customers.update(...args) as unknown,
      del: (...args: any) => mockFns.customers.del(...args) as unknown,
    },
    paymentIntents: {
      create: (...args: any) =>
        mockFns.paymentIntents.create(...args) as unknown,
      retrieve: (...args: any) =>
        mockFns.paymentIntents.retrieve(...args) as unknown,
      update: (...args: any) =>
        mockFns.paymentIntents.update(...args) as unknown,
      cancel: (...args: any) =>
        mockFns.paymentIntents.cancel(...args) as unknown,
    },
  },
}));
/* eslint-enable @typescript-eslint/no-explicit-any -- End of mocking*/

const prisma = new PrismaClient();
const SUITE_PREFIX = "purchase";

const addPurchaseTestForUser = (
  prismaWithAccess: PrismaClient,
  identification: ShopIdentification,
  tickets: MockTickets,
) => {
  beforeEach(async () => {
    await addTicketToCart(
      prismaWithAccess,
      tickets.activeTicket.id,
      identification,
    );

    mockFns.customers.create.mockResolvedValue({
      id: "customer-id",
    });
    mockFns.customers.retrieve.mockResolvedValue({
      deleted: false,
      id: "customer-id",
    });
    mockFns.paymentIntents.create.mockResolvedValue({
      client_secret: "abc",
      id: "intent-id",
    });
  });
  afterEach(async () => {
    await prisma.consumable.deleteMany({
      where: {
        ...dbIdentification(identification),
      },
    });
    Object.values(mockFns).forEach((mock) => {
      Object.values(mock).forEach((fn) => {
        fn.mockClear();
      });
    });
    if (identification.memberId) {
      await prisma.member.update({
        where: {
          id: identification.memberId,
          stripeCustomerId: {
            not: null,
          },
        },
        data: {
          stripeCustomerId: null,
        },
      });
    }
  });
  it("mocks stripe correctly", async () => {
    const { default: stripe } = await import("./stripe");
    const customer = await stripe.customers.retrieve("customer-id");
    expect(customer).toBeDefined();
    expect(customer.id).toBe("customer-id");
    expect(mockFns.customers.retrieve).toHaveBeenCalledOnce();
    mockFns.customers.retrieve.mockClear();
    mockFns.customers.retrieve.mockResolvedValueOnce(false);
    const customer2 = await stripe.customers.retrieve("customer-id");
    expect(customer2).toBe(false);
    expect(mockFns.customers.retrieve).toHaveBeenCalledOnce();
  });
  it("creates a payment intent", async () => {
    const res = await purchaseCart(
      prismaWithAccess,
      identification,
      "idempotency-key",
    );
    expect(res).toBeDefined();
    expect(res.clientSecret).toBe("abc");
    expect(mockFns.paymentIntents.create).toHaveBeenCalledOnce();
    expect(mockFns.paymentIntents.create.mock.calls[0][0].amount).toBe(
      MOCK_ACTIVE_TICKET.shoppable.price +
        transactionFee(MOCK_ACTIVE_TICKET.shoppable.price),
    );

    expect(mockFns.paymentIntents.create.mock.calls[0][1].idempotencyKey).toBe(
      "idempotency-key",
    );
    const consumable = await prisma.consumable.findFirst({
      where: {
        ...dbIdentification(identification),
        purchasedAt: null,
      },
    });
    expect(consumable).toBeDefined();
    expect(consumable!.stripeIntentId).toBe("intent-id");
  });
  it("removes old payment intent on multiple calls", async () => {
    await purchaseCart(prismaWithAccess, identification, "idempotency-key");
    mockFns.paymentIntents.create =
      mockFns.paymentIntents.create.mockResolvedValueOnce({
        client_secret: "def",
        id: "intent-id2",
      });
    mockFns.paymentIntents.retrieve.mockResolvedValueOnce({
      status: "requires_payment_method",
    });
    const res2 = await purchaseCart(
      prismaWithAccess,
      identification,
      "idempotency-key",
    );
    expect(res2).toBeDefined();
    expect(res2.clientSecret, res2.message).toBe("def");
    expect(mockFns.paymentIntents.create).toHaveBeenCalledTimes(2);
    expect(mockFns.paymentIntents.cancel).toHaveBeenCalledOnce();
    expect(mockFns.paymentIntents.create.mock.calls[1][0].amount).toBe(
      MOCK_ACTIVE_TICKET.shoppable.price +
        transactionFee(MOCK_ACTIVE_TICKET.shoppable.price),
    );
    expect(mockFns.paymentIntents.create.mock.calls[0][1].idempotencyKey).toBe(
      "idempotency-key",
    );
    expect(mockFns.paymentIntents.create.mock.calls[1][1].idempotencyKey).toBe(
      "idempotency-key",
    );
    const consumable = await prisma.consumable.findFirst({
      where: {
        ...dbIdentification(identification),
        purchasedAt: null,
      },
    });
    expect(consumable).toBeDefined();
    expect(consumable!.stripeIntentId).toBe("intent-id2");
  });

  describe("stripe customer creation", () => {
    if (identification.memberId) {
      it("creates a stripe customer if no stripe id in db", async () => {
        await purchaseCart(prismaWithAccess, identification, "idempotency-key");
        expect(mockFns.customers.retrieve).not.toHaveBeenCalled();
        expect(mockFns.customers.create).toHaveBeenCalledOnce();
      });

      it("creates a stripe customer if not found in stripe", async () => {
        await prisma.member.update({
          where: {
            id: identification.memberId,
          },
          data: {
            stripeCustomerId: "customer-id",
          },
        });
        mockFns.customers.retrieve.mockRejectedValueOnce(
          new Error("Customer not found"),
        );
        await purchaseCart(prismaWithAccess, identification, "idempotency-key");
        expect(mockFns.customers.create).toHaveBeenCalledOnce();
        expect(mockFns.customers.retrieve).toHaveBeenCalledOnce();
      });

      it("does not create a stripe customer if found in stripe", async () => {
        await prisma.member.update({
          where: {
            id: identification.memberId,
          },
          data: {
            stripeCustomerId: "customer-id",
          },
        });
        await purchaseCart(prismaWithAccess, identification, "idempotency-key");
        expect(mockFns.customers.create).not.toHaveBeenCalled();
        expect(mockFns.customers.retrieve).toHaveBeenCalledOnce();
      });
    } else {
      it("does not create a stripe customer if not logged in", async () => {
        await purchaseCart(prismaWithAccess, identification, "idempotency-key");
        expect(mockFns.customers.create).not.toHaveBeenCalled();
        expect(mockFns.customers.retrieve).not.toHaveBeenCalled();
      });
    }
  });
};

describe("Purchase as logged in user", async () => {
  const users = await addMockUsers(prisma, SUITE_PREFIX);
  const tickets = await addMockTickets(prisma, users.adminMember);

  const prismaWithAccess = enhance(prisma, {
    user: {
      studentId: users.customerMember.studentId,
      memberId: users.customerMember.id,
      policies: await getAccessPolicies(
        prisma,
        users.customerMember.studentId!,
      ),
    },
  });
  addPurchaseTestForUser(
    prismaWithAccess,
    {
      memberId: users.customerMember.id,
    },
    tickets,
  );

  afterAll(async () => {
    const ticketIds = Object.values(tickets).map((t) => t.id);
    await removeMockTickets(prisma, ticketIds);
    await removeMockUsers(
      prisma,
      Object.values(users).map((u) => u.id),
    );
  });
});
describe("Purchase as anonymous user", async () => {
  const users = await addMockUsers(prisma, SUITE_PREFIX);
  const tickets = await addMockTickets(prisma, users.adminMember);

  const prismaWithAccess = enhance(prisma, {
    user: {
      studentId: undefined,
      memberId: undefined,
      policies: [],
      externalCode: "external-code",
    },
  });
  addPurchaseTestForUser(
    prismaWithAccess,
    {
      externalCode: "external-code",
    },
    tickets,
  );
  afterAll(async () => {
    const ticketIds = Object.values(tickets).map((t) => t.id);
    await removeMockTickets(prisma, ticketIds);
    await removeMockUsers(
      prisma,
      Object.values(users).map((u) => u.id),
    );
  });
});

afterAll(async () => {
  await removeAllTestData(prisma, SUITE_PREFIX);
  prisma.$disconnect();
});
