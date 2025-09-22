import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import { compareCommitteePositions } from "$lib/utils/committee-ordering/sort";
import * as m from "$paraglide/messages";
import { error, fail, type Actions } from "@sveltejs/kit";
import { zod } from "sveltekit-superforms/adapters";
import { message, superValidate, withFiles } from "sveltekit-superforms/server";
import { updateSchema } from "./types";
import { updateMarkdown } from "$lib/news/markdown/mutations.server";
import { getYearOrThrowSvelteError } from "$lib/utils/url.server";

/**
 * Load all data that every committee load function needs
 * @param prisma The Prisma client
 * @param shortName The committee's short name
 * @param url The URL object
 * @returns All data that the every committee load function needs
 */
export const committeeLoad = async (
  prisma: ExtendedPrisma,
  shortName: string,
  url: URL,
) => {
  const currentYear = new Date().getFullYear();
  // Allow to see committees from 1982 to the NEXT year
  const year = getYearOrThrowSvelteError(url, {
    upperBound: currentYear + 1,
  });

  const firstDayOfYear = new Date(`${year}-01-01`);
  const lastDayOfYear = new Date(`${year}-12-31`);
  if (
    firstDayOfYear.toString() === "Invalid Date" ||
    lastDayOfYear.toString() === "Invalid Date" ||
    firstDayOfYear.getFullYear() !== year ||
    lastDayOfYear.getFullYear() !== year
  ) {
    error(400, m.committees_errors_invalidYear());
  }

  const committee = await prisma.committee.findUnique({
    where: {
      shortName,
    },
    include: {
      positions: {
        include: {
          mandates: {
            where: {
              startDate: {
                lte: lastDayOfYear,
              },
              endDate: {
                gte: firstDayOfYear,
              },
            },
            include: {
              member: true,
            },
            orderBy: [
              {
                startDate: "desc",
              },
              {
                member: {
                  firstName: "asc",
                },
              },
              {
                member: {
                  lastName: "asc",
                },
              },
            ],
          },
          emailAliases: {
            select: {
              email: true,
            },
          },
        },
      },
    },
  });
  if (!committee) {
    throw error(404, m.committees_errors_committeeNotFound());
  }
  const [uniqueMembersInCommittee, numberOfMandates, markdown] =
    await Promise.allSettled([
      prisma.member.count({
        where: {
          mandates: {
            some: {
              startDate: {
                lte: lastDayOfYear,
              },
              endDate: {
                gte: firstDayOfYear,
              },
              position: {
                committee: {
                  shortName,
                },
              },
            },
          },
        },
      }),
      prisma.mandate.count({
        where: {
          startDate: {
            lte: lastDayOfYear,
          },
          endDate: {
            gte: firstDayOfYear,
          },
          position: {
            committee: {
              shortName,
            },
          },
        },
      }),
      prisma.markdown.findUnique({
        where: {
          name: shortName,
        },
      }),
      prisma.committee.findUnique({
        where: {
          shortName,
        },
      }),
    ]);
  if (uniqueMembersInCommittee.status === "rejected") {
    error(500, m.committees_errors_fetchUniqueMembers());
  }
  if (numberOfMandates.status === "rejected") {
    error(500, m.committees_errors_fetchNumberOfMandates());
  }
  if (markdown.status === "rejected") {
    error(500, m.committees_errors_fetchMarkdown());
  }

  const form = await superValidate(
    {
      ...committee,
      markdownSlug: markdown.value?.name,
      markdownSv: markdown.value?.markdown,
      markdownEn: markdown.value?.markdownEn,
    },
    zod(updateSchema),
  );

  return {
    committee,
    positions: committee.positions
      // include active positions, or inactive positions with mandates
      .filter((pos) => pos.mandates.length > 0 || pos.active)
      .toSorted((a, b) => compareCommitteePositions(a.id, b.id, shortName)),
    uniqueMemberCount: uniqueMembersInCommittee.value,
    numberOfMandates: numberOfMandates.value,
    markdown: markdown.value,
    form,
    year,
  };
};

export const committeeActions = (
  shortName?: string,
): Actions<{ shortName: string }> => ({
  update: async ({ params, request, locals }) => {
    const { user, prisma } = locals;
    const form = await superValidate(request, zod(updateSchema), {
      allowFiles: true,
    });
    if (!form.valid) return fail(400, withFiles({ form }));

    const { markdownSv, markdownEn, markdownSlug, ...rest } = form.data;

    await prisma.committee.update({
      where: { shortName: shortName ?? params.shortName },
      data: {
        ...rest,
      },
    });

    if (markdownSlug && markdownSv) {
      await updateMarkdown(user, prisma, {
        name: markdownSlug,
        markdownSv,
        markdownEn: markdownEn ?? null,
      });
    }
    return message(form, {
      message: m.committees_committeeUpdated(),
      type: "success",
    });
  },
});

export type CommitteeLoadData = Awaited<ReturnType<typeof committeeLoad>>;
