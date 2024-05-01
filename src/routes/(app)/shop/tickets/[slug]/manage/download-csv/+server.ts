import apiNames from "$lib/utils/apiNames.js";
import { authorize } from "$lib/utils/authorization.js";
import type {
  Consumable,
  Event,
  Member,
  Shoppable,
  Ticket,
} from "@prisma/client";
import { error } from "@sveltejs/kit";
import dayjs from "dayjs";

export const GET = async ({ locals, params }) => {
  const { user, prisma } = locals;
  const ticket = await prisma.ticket.findUnique({
    where: {
      id: params.slug,
    },
    include: {
      shoppable: {
        include: {
          consumables: {
            include: {
              member: true,
            },
          },
          reservations: {
            include: {
              member: true,
            },
          },
        },
      },
      event: true,
    },
  });
  if (!ticket) {
    error(404, "Ticket not found");
  }
  if (ticket.shoppable.authorId !== user.memberId) {
    // author can always manage
    authorize(apiNames.WEBSHOP.MANAGE, user);
  }
  const consumables = ticket.shoppable.consumables;
  const csv = generateCSV(ticket, consumables);
  // return csv as file
  const res = new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=${ticket.shoppable.title}.csv`,
    },
  });
  return res;
};

const generateCSV = (
  ticket: Ticket & {
    shoppable: Shoppable;
    event: Event;
  },
  consumables: Array<Consumable & { member: Member | null }>,
): string => {
  let output = "";
  const headers =
    "Namn,Email,Matpreferens,Betalad mängd,Köpdatum,Payment Intent id";
  output += headers + "\n";
  const priceFormatter = new Intl.NumberFormat("sv-SE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    currency: "SEK",
    currencyDisplay: "code",
  });
  for (const consumable of consumables) {
    const member = consumable.member;
    const name = member
      ? `${member.firstName} ${member.lastName}`
      : "Anonym användare";
    const email = member
      ? "Finns inte"
      : consumable.externalCustomerEmail ?? "Finns inte";
    const paidAmount = consumable.priceAtPurchase
      ? priceFormatter
          .format(consumable.priceAtPurchase / 100)
          .replace(",", ".")
      : "Okänt";
    const foodPreference = member
      ? member?.foodPreference ?? ""
      : "Anonym användare";
    const row = `${name},${email},${foodPreference},${paidAmount},${dayjs(
      consumable.purchasedAt,
    ).format("YYYY-MM-DD HH:mm:ss")},${consumable.stripeIntentId ?? "N/A"}`;
    output += row + "\n";
  }
  return output;
};
