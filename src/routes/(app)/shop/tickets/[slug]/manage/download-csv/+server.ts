import dayjs from "dayjs";
import { loadTicketData } from "../loadTicketData";
import type { ConsumableRowData } from "../types";
import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
import * as messages from "$paraglide/messages";

export const GET = async ({ locals, params }) => {
  const { user, prisma } = locals;
  const { ticket, consumables } = await loadTicketData(
    prisma,
    user,
    params.slug,
  );
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
  ticket: ExtendedPrismaModel<"Ticket"> & {
    shoppable: ExtendedPrismaModel<"Shoppable"> & {
      questions: Array<ExtendedPrismaModel<"ItemQuestion">>;
    };
    event: ExtendedPrismaModel<"Event">;
  },
  consumables: ConsumableRowData[],
): string => {
  let output = "";
  let headers: string = messages.shop_tickets_csvHeader();
  for (const question of ticket.shoppable.questions) {
    headers += `,${question.title.replace(",", " ")}`;
  }
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
      ? `${member.firstName} ${member.lastName}`.replace(",", " ")
      : messages.shop_tickets_anonymousUser();
    const stiLId = member ? member.studentId : messages.shop_tickets_anonymousUser();
    const email = member
      ? messages.shop_tickets_doesNotExist()
      : (consumable.externalCustomerEmail?.replace(",", " ") ?? messages.shop_tickets_doesNotExist());
    const paidAmount = consumable.priceAtPurchase
      ? priceFormatter
          .format(consumable.priceAtPurchase / 100)
          .replace(",", ".")
      : messages.shop_tickets_unknown();
    const foodPreference = member
      ? (member?.foodPreference?.replace(",", " ") ?? "")
      : messages.shop_tickets_anonymousUser();
    const phadderGroup = member
      ? (member?.phadderGroup?.name.replace(",", " ") ?? "")
      : messages.shop_tickets_anonymousUser();
    let row = `${name},${stiLId},${email},${foodPreference},${phadderGroup},${paidAmount},${dayjs(
      consumable.purchasedAt,
    ).format("YYYY-MM-DD HH:mm:ss")},${
      consumable.stripeIntentId?.replace(",", " ") ?? "N/A"
    }`;
    for (const question of ticket.shoppable.questions) {
      const response = consumable.questionResponses.find(
        (r) => r.questionId === question.id,
      );
      if (!response) row += `,`;
      else row += `,${response.answer.replace(",", " ")}`;
    }
    output += row + "\n";
  }
  return output;
};
