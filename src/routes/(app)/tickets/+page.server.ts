import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import type { Event, PrismaClient, Tag } from "@prisma/client";
import { fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { PageServerLoad } from "./$types";

export type Ticket = {
  id: string;
  event: Event & {
    tags: Tag[];
    imageUrl: string;
  };

  title: string;
  description: string;

  price: number;

  availableFrom: Date;
  availableTo: Date;
};

// Function to generate mock tickets
const generateMockTickets = async (
  prisma: PrismaClient,
  amount: number,
  daysAgoStart = 30,
): Promise<Ticket[]> => {
  const mockTickets: Ticket[] = [];
  const startDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * daysAgoStart); // start a month ago
  const tags = await prisma.tag.findMany();
  const daysBetween = (daysAgoStart * 2) / amount;

  for (let i = 1; i < amount; i++) {
    const id = i.toString();
    const title = `Ticket ${i}`;
    const description = `Description for Ticket ${i}`;
    const availableFrom = new Date(
      startDate.valueOf() + i * 1000 * 60 * 60 * 24 * daysBetween,
    );
    const availableTo = new Date(
      availableFrom.valueOf() + (1000 * 60 * 60 * 24 * daysBetween) / 2,
    );

    const eventId = i % 10;

    // Create a new ticket object
    const ticket: Ticket = {
      id,
      event: {
        id: eventId.toString(),
        slug: `event-${eventId}`,
        imageUrl: `https://picsum.photos/seed/${eventId}/600/400`,
        title: `Event ${eventId}`,
        titleEn: null,
        description: `This is a long description for event ${eventId} spanning multiple lines and could include markdown. **All right?** This is *italic* and this is _underlined_.`,
        descriptionEn: null,
        shortDescription: `Come join us at event ${eventId}`,
        shortDescriptionEn: null,
        location: [
          "iDét",
          "Foajén",
          "E:A",
          "Gasquesalen",
          "Lophtet",
          "Victoriastadion",
          "Edekvata",
          "GG",
          "AF-borgen",
        ][eventId % 9]!,
        organizer: ["Sexet", "Styrelsen", "Staben", "D-sek", "AktU", "NärU"][
          eventId % 6
        ]!,
        startDatetime: new Date(
          availableFrom.valueOf() + 1000 * 60 * 60 * 24 * 30,
        ),
        endDatetime: new Date(
          availableFrom.valueOf() +
            1000 * 60 * 60 * 24 * 30 +
            1000 * 60 * 60 * 4,
        ),
        tags: new Array(eventId % 4).map(
          (_, index) => tags[(eventId + index) % tags.length]!,
        ),
        numberOfUpdates: 1,
        removedAt: null,
        alarmActive: false,
        link: null,
        authorId: "1",
      },
      title,
      description,
      availableFrom,
      availableTo,
      price: Math.floor(((i * 736) % 18000) / 100) * 100 + 1300,
    };

    // Push the ticket to the array
    mockTickets.push(ticket);
  }

  return mockTickets;
};

export const load: PageServerLoad = async ({ locals }) => {
  return {
    tickets: (await generateMockTickets(locals.prisma, 102, 30)).toSorted(
      (a, b) => a.availableFrom.valueOf() - b.availableFrom.valueOf(),
    ),
    addToCartForm: await superValidate(addToCartSchema),
  };
};

const addToCartSchema = z.object({
  ticketId: z.string(),
});
export type AddToCartSchema = typeof addToCartSchema;

export const actions = {
  addToCart: async (event) => {
    const { locals, request } = event;
    const { user } = locals;
    const form = await superValidate(request, addToCartSchema);
    if (!form.valid) return fail(400, { form });
    authorize(apiNames.WEBSHOP.PURCHASE, user);

    // addToCart logic here

    /**
     * possible outcomes:
     * - success: ticket added to cart
     * - internal error: ticket could not be added to cart
     * - 400 (see below)
     */

    /***
     * Criteria:
     * - Exists
     * - Is available (not upcoming, not expired)
     * - Stock left (not sold out)
     * Then:
     * If < 1 min since launch (reserve ticket):
     * - Item is already not reserved by user
     * Else:
     * - User does not already have max amount in cart
     */

    /***
     * Criteria:
     * - Exists -> Doesn't exist (400)
     * - Is available (not upcoming, not expired) -> Not available (400)
     * - Stock left (not sold out) -> Sold out (400)
     * Then:
     * If < 1 min since launch (reserve ticket):
     * - Item is already not reserved by user -> Already reserved (400)
     * Else:
     * - User does not already have max amount in cart -> Already max in cart (400)
     */
    // const result = Math.floor(Math.random() * 8);
    // switch (result) {
    //   case 0:
    //     // success
    //     throw redirect(
    //       "/cart",
    //       {
    //         message: "Biljett tillagd i varukorgen!",
    //         type: "success",
    //       },
    //       event,
    //     );
    //   case 1:
    //     // internal error
    //     return message(form, {
    //       message: "Något gick fel, försök igen senare",
    //       type: "error",
    //     });
    //   case 2:
    //     // 400
    //     return message(form, {
    //       message: "Kunde inte hitta biljett",
    //       type: "error",
    //     });
    //   case 3:
    //     // 400
    //     return message(form, {
    //       message: "Biljett är inte tillgänlig än",
    //       type: "error",
    //     });
    //   case 4:
    //     // 400
    //     return message(form, {
    //       message: "Biljettförsäljning har stängt",
    //       type: "error",
    //     });
    //   case 5:
    //     // 400
    //     return message(form, {
    //       message: "Biljetten är slutsåld",
    //       type: "error",
    //     });
    //   case 6:
    //     // already reserved
    //     return message(form, {
    //       message:
    //         "Biljetten är redan reserverad, du får en notis när lottning är avklarad.",
    //       type: "error",
    //     });
    //   case 7:
    //     return message(form, {
    //       // message: "Du har redan max antal biljetter i varukorgen", // if max > 1
    //       message: "Du har redan den här biljetten i varukorgen",
    //       type: "error",
    //     });
    // }

    return redirect(
      "/cart",
      {
        message: "Biljett tillagd i varukorgen!",
        type: "success",
      },
      event,
    );
  },
};
