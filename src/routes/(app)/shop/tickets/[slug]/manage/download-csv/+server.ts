import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import type {
  Consumable,
  Event,
  ItemQuestion,
  ItemQuestionResponse,
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
          questions: true,
          consumables: {
            include: {
              questionResponses: true,
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
    shoppable: Shoppable & {
      questions: ItemQuestion[];
    };
    event: Event;
  },
  consumables: Array<
    Consumable & {
      member: Member | null;
      questionResponses: ItemQuestionResponse[];
    }
  >,
): string => {
  let output = "";
  let headers =
    "Namn,Email,Matpreferens,Betalad mängd,Köpdatum,Payment Intent id";
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
    let row = `${name},${email},${foodPreference},${paidAmount},${dayjs(
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
