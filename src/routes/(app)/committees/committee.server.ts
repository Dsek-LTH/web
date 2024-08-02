import { PUBLIC_BUCKETS_MATERIAL } from "$env/static/public";
import { fileHandler } from "$lib/files";
import { compareCommitteePositions } from "$lib/utils/committee-ordering/sort";
import * as m from "$paraglide/messages";
import type { PrismaClient } from "@prisma/client";
import { error, fail, type Actions } from "@sveltejs/kit";
import { zod } from "sveltekit-superforms/adapters";
import { message, superValidate, withFiles } from "sveltekit-superforms/server";
import { updateSchema } from "./types";
/**
 * @param shortName The committee's short name
 * @param year The year to load the committee for, defaults to current year
 * @returns All data that the every committee load function needs
 */
export const committeeLoad = async (
  prisma: PrismaClient,
  shortName: string,
  year = new Date().getFullYear(),
) => {
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

  const form = await superValidate(committee, zod(updateSchema));

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
  };
};

export const committeeActions = (
  shortName?: string,
): Actions<{ shortName: string }> => ({
  update: async ({ params, request, locals }) => {
    const { prisma, user } = locals;
    const form = await superValidate(request, zod(updateSchema), {
      allowFiles: true,
    });
    if (!form.valid) return fail(400, withFiles({ form }));
    let newImageUploaded = false;
    const { name, description, image, markdown, markdownSlug } = form.data;
    if (image !== undefined) {
      const path = `committees/${shortName ?? params.shortName}.svg`;
      try {
        const putUrl = await fileHandler.getPresignedPutUrl(
          user,
          PUBLIC_BUCKETS_MATERIAL,
          path,
          true,
        );
        await fetch(putUrl, {
          method: "PUT",
          body: image,
        });
        newImageUploaded = true;
      } catch (e) {
        return message(
          form,
          { message: m.committees_errors_uploadImage(), type: "error" },
          { status: 500 },
        );
      }
    }
    await prisma.committee.update({
      where: { shortName: shortName ?? params.shortName },
      data: {
        name,
        description,
        imageUrl: newImageUploaded
          ? `minio/material/committees/${
              shortName ?? params.shortName
            }.svg?version=${new Date().getTime()}`
          : undefined,
      },
    });

    if (markdownSlug && markdown) {
      await prisma.markdown.update({
        where: {
          name: markdownSlug,
        },
        data: {
          markdown,
        },
      });
    }
    return message(form, {
      message: m.committees_committeeUpdated(),
      type: "success",
    });
  },
});
