import { fileHandler } from "$lib/files";
import { error, fail, type Actions } from "@sveltejs/kit";
import { message, setError, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import { PUBLIC_BUCKETS_MATERIAL } from "$env/static/public";
import { compareCommitteePositions } from "$lib/utils/committee-ordering/sort";
import type { PrismaClient } from "@prisma/client";
import * as m from "$paraglide/messages";
import { userLevelCached } from "$lib/utils/caching/cached";
import type { AuthUser } from "@zenstackhq/runtime";
import { CacheDependency, TIME_IN_MS } from "$lib/utils/caching/cache";

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable(),
  image: z.any().optional(),
  markdown: z.string().optional(),
  markdownSlug: z.string().optional(),
});

export type UpdateSchema = typeof updateSchema;

/**
 * @param shortName The committee's short name
 * @param year The year to load the committee for, defaults to current year
 * @returns All data that the every committee load function needs
 */
export const committeeLoad = async (
  user: AuthUser,
  prisma: PrismaClient,
  shortName: string,
  year = new Date().getFullYear(),
) => {
  return userLevelCached(
    user,
    `committee/${shortName}/year`,
    async (_, prisma) => {
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

      const form = await superValidate(committee, updateSchema);

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
    },
    [CacheDependency.MANDATES_AND_POSITIONS],
    TIME_IN_MS.THIRY_MINUTES,
    prisma,
  );
};

export const committeeActions = (
  shortName?: string,
): Actions<{ shortName: string }> => ({
  update: async ({ params, request, locals }) => {
    const { prisma, user } = locals;
    const formData = await request.formData();
    const form = await superValidate(formData, updateSchema);
    if (!form.valid) return fail(400, { form });
    const image = formData.get("image");
    let newImageUploaded = false;
    if (isFileSubmitted(image)) {
      if (image.type !== "image/svg+xml") {
        return setError(form, "image", m.committees_errors_imageMustBeSVG());
      }
      const path = `committees/${shortName ?? params.shortName}.svg`;
      if (image) {
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
    }
    await prisma.committee.update({
      where: { shortName: shortName ?? params.shortName },
      data: {
        name: form.data.name,
        description: form.data.description,
        imageUrl: newImageUploaded
          ? `minio/material/committees/${
              shortName ?? params.shortName
            }.svg?version=${new Date().getTime()}`
          : undefined,
      },
    });

    const markdownSlug = form.data.markdownSlug;
    const markdown = form.data.markdown;
    if (markdownSlug && markdown) {
      await prisma.markdown.update({
        where: {
          name: markdownSlug,
        },
        data: {
          markdown: form.data.markdown,
        },
      });
    }
    return message(form, {
      message: m.committees_committeeUpdated(),
      type: "success",
    });
  },
});

function isFileSubmitted(file: unknown): file is File {
  return file instanceof File && file.size > 0;
}
