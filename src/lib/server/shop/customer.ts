import authorizedPrismaClient from "./authorizedPrisma";
import { stripe } from "./stripe";
import { getFullName } from "$lib/utils/client/member";
import type { Member } from "@prisma/client";

const createStripeCustomer = async ({ member }: { member: Member }) => {
  const { id, studentId } = member;
  try {
    const customer = await stripe.customers.create({
      name: getFullName({ ...member, nickname: null }),
      description: `D-sek member: ${studentId}`,
      metadata: {
        member: id,
      },
    });
    try {
      await authorizedPrismaClient.member.update({
        where: { id },
        data: { stripeCustomerId: customer.id },
      });
      return customer;
    } catch (error) {
      console.error(
        `Could not save customer stripe info: ${member.id}, ${customer.id}`,
      );
      throw new Error(`Could not save customer info: ${error}`);
    }
  } catch (error) {
    throw new Error(`Failed to create stripe customer: ${error}`);
  }
};

/**
 * Gets stripe customer connected to member, or creates a new one if none exists.
 */
export const obtainStripeCustomer = async (member: Member) => {
  const { stripeCustomerId } = member;
  if (!stripeCustomerId) {
    return await createStripeCustomer({ member });
  }

  try {
    // check that customer exists and is not deleted
    const customer = await stripe.customers.retrieve(stripeCustomerId);
    if (!customer.deleted) {
      return customer;
    }
    // if customer is deleted, create a new one
  } catch (error) {
    console.error("Could not get customer", error);
  }
  return await createStripeCustomer({ member });
};
