import { fileHandler } from "$lib/files";
import { withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { error, fail } from "@sveltejs/kit";
import { message, setError, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { PageServerLoad } from "./$types";
import { PUBLIC_BUCKETS_MATERIAL } from "$env/static/public";
import { compareCommitteePositions } from "$lib/utils/committee-ordering/sort";

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable(),
  image: z.any().optional(),
});

export type UpdateSchema = typeof updateSchema;

export const load: PageServerLoad = async ({ params }) => {
  const committee = await prisma.committee.findUnique({
    where: {
      shortName: params.shortName,
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
  });
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
              shortName: params.shortName,
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
          shortName: params.shortName,
        },
      },
    },
  });
  const markdown = committee.shortName
    ? await prisma.markdown.findUnique({
        where: {
          name: params.shortName,
        },
      })
    : null;
  const form = await superValidate(committee, updateSchema);
  return {
    committee,
    positions: committee.positions.toSorted((a, b) =>
      compareCommitteePositions(a.id, b.id, params.shortName),
    ),
    uniqueMemberCount: uniqueMembersInCommittee,
    numberOfMandates,
    markdown,
    form,
  };
};

export const actions = {
  update: async ({ params, request, locals }) => {
    const formData = await request.formData();
    const form = await superValidate(formData, updateSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.COMMITTEE.UPDATE,
      session?.user,
      async () => {
        const image = formData.get("image");
        let newImageUploaded = false;
        if (isFileSubmitted(image)) {
          if (image.type !== "image/svg+xml") {
            return setError(form, "image", "Bilden måste vara i .svg format ");
          }
          const path = `committees/${params.shortName}.svg`;
          if (image) {
            try {
              const putUrl = await fileHandler.getPresignedPutUrl(
                session?.user,
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
          where: { shortName: params.shortName },
          data: {
            name: form.data.name,
            description: form.data.description,
            imageUrl: newImageUploaded
              ? `minio/material/committees/${
                  params.shortName
                }.svg?version=${new Date().getTime()}`
              : undefined,
          },
        });
        return message(form, {
          message: "Utskott uppdaterat",
          type: "success",
        });
      },
      form,
    );
  },
};

function isFileSubmitted(file: unknown): file is File {
  return file instanceof File && file.size > 0;
}
