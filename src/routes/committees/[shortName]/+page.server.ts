import { fileHandler } from "$lib/files";
import { ctxAccessGuard } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { Prisma } from "@prisma/client";
import { error, fail } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

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
        orderBy: {
          name: "asc",
        },
      },
    },
  });
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
  if (!committee) {
    throw error(404, "Committee not found");
  }
  return {
    committee,
    positions: committee.positions,
    uniqueMemberCount: uniqueMembersInCommittee,
    numberOfMandates,
  };
};

export const actions = {
  update: async ({ params, request, locals }) => {
    const session = await locals.getSession();
    await ctxAccessGuard(apiNames.COMMITTEE.UPDATE, session?.user);
    const formData = await request.formData();
    const image = formData.get("image");
    formData.delete("image"); // for serialization purposes
    let newImageUploaded = false;
    if (image && image instanceof File) {
      console.log(image);
      const path = `committees/${params.shortName}.svg`;
      console.log(path);
      try {
        const putUrl = await fileHandler.getPresignedPutUrl(session?.user, "material", path, true);
        await fetch(putUrl, {
          method: "PUT",
          body: image,
        });
        newImageUploaded = true;
      } catch (e: any) {
        return fail(500, {
          error: e?.message ?? "Unable to upload image",
          data: Object.fromEntries(formData),
        });
      }
    }
    try {
      await prisma.committee.update({
        where: { shortName: params.shortName },
        data: {
          name: (formData.get("name") as string | null) ?? undefined,
          description: (formData.get("description") as string | null) ?? undefined,
          imageUrl: newImageUploaded
            ? `http://127.0.0.1:9000/material/committees/${
                params.shortName
              }.svg?version=${new Date().getTime()}`
            : undefined,
        },
      });
      return {
        success: true,
        data: Object.fromEntries(formData),
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2025" || e.code === "2016") {
          return fail(404, { error: "Committee not found", data: Object.fromEntries(formData) });
        }
        return fail(500, {
          error: e.message ?? "Unknown error",
          data: Object.fromEntries(formData),
        });
      }
    }
  },
};
