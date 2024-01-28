import { fileHandler } from "$lib/files";
import { error, fail, type Actions } from "@sveltejs/kit";
import { message, setError, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import { PUBLIC_BUCKETS_MATERIAL } from "$env/static/public";
import { compareCommitteePositions } from "$lib/utils/committee-ordering/sort";
import type { PrismaClient } from "@prisma/client";
import translated from "$lib/utils/translated";

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable(),
  image: z.any().optional(),
  markdown: z.string().optional(),
  markdownSlug: z.string().optional(),
});

export type UpdateSchema = typeof updateSchema;
type ParamType = { shortName: string };

/**
 * @param shortName The committee's short name
 * @returns All data that the every committee load function needs
 */
export const committeeLoad = async (
  prisma: PrismaClient,
  shortName: string,
) => {
  const committee = await prisma.committee
    .findUnique({
      where: {
        shortName,
      },
      include: {
        positions: {
          where: {
            active: true,
          },
          include: {
            mandates: {
              where: {
                startDate: {
                  lte: new Date(),
                },
                endDate: {
                  gte: new Date(),
                },
              },
              include: {
                member: true,
              },
            },
            emailAliases: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    })
    .then(translated);
  if (!committee) {
    throw error(404, "Committee not found");
  }
  const uniqueMembersInCommittee = await prisma.member.count({
    where: {
      mandates: {
        some: {
          startDate: {
            lte: new Date(),
          },
          endDate: {
            gte: new Date(),
          },
          position: {
            active: true,
            committee: {
              shortName,
            },
          },
        },
      },
    },
  });
  const numberOfMandates = await prisma.mandate.count({
    where: {
      startDate: {
        lte: new Date(),
      },
      endDate: {
        gte: new Date(),
      },
      position: {
        active: true,
        committee: {
          shortName,
        },
      },
    },
  });
  const markdown = committee.shortName
    ? await prisma.markdown
        .findUnique({
          where: {
            name: shortName,
          },
        })
        .then(translated)
    : null;
  const form = await superValidate(committee, updateSchema);
  return {
    committee,
    positions: committee.positions.toSorted((a, b) =>
      compareCommitteePositions(a.id, b.id, shortName),
    ),
    uniqueMemberCount: uniqueMembersInCommittee,
    numberOfMandates,
    markdown,
    form,
  };
};

export const committeeActions = (shortName?: string): Actions<ParamType> => ({
  update: async ({ params, request, locals }) => {
    const { prisma, user } = locals;
    const formData = await request.formData();
    const form = await superValidate(formData, updateSchema);
    if (!form.valid) return fail(400, { form });
    const image = formData.get("image");
    let newImageUploaded = false;
    if (isFileSubmitted(image)) {
      if (image.type !== "image/svg+xml") {
        return setError(form, "image", "Bilden måste vara i .svg format ");
      }
      const path = `committees/${shortName || params.shortName}.svg`;
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
            { message: "Kunde inte ladda upp bild", type: "error" },
            { status: 500 },
          );
        }
      }
    }
    await prisma.committee.update({
      where: { shortName: shortName || params.shortName },
      data: {
        name: form.data.name,
        description: form.data.description,
        imageUrl: newImageUploaded
          ? `minio/material/committees/${
              shortName || params.shortName
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
      message: "Utskott uppdaterat",
      type: "success",
    });
  },
});

function isFileSubmitted(file: unknown): file is File {
  return file instanceof File && file.size > 0;
}
