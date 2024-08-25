import type { Event, ItemQuestion, Shoppable, Ticket } from "@prisma/client";
import dayjs from "dayjs";
import { loadTicketData } from "../loadTicketData";
import type { ConsumableRowData } from "../types";

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
  ticket: Ticket & {
    shoppable: Shoppable & {
      questions: ItemQuestion[];
    };
    event: Event;
  },
  consumables: ConsumableRowData[],
): string => {
  let output = "";
  let headers =
    "Namn,Email,Matpreferens,Phaddergrupp,Betalad mängd,Köpdatum,Payment Intent id";
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
      : "Anonym användare";
    const email = member
      ? "Finns inte"
      : (consumable.externalCustomerEmail?.replace(",", " ") ?? "Finns inte");
    const paidAmount = consumable.priceAtPurchase
      ? priceFormatter
          .format(consumable.priceAtPurchase / 100)
          .replace(",", ".")
      : "Okänt";
    const foodPreference = member
      ? (member?.foodPreference?.replace(",", " ") ?? "")
      : "Anonym användare";
    const phadderGroup = member
      ? (member?.phadderGroup?.name.replace(",", " ") ?? "")
      : "Anonym användare";
    let row = `${name},${email},${foodPreference},${phadderGroup},${paidAmount},${dayjs(
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
