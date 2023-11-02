import { ctxAccessGuard } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { error, fail } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { Prisma } from "@prisma/client";

export const load: PageServerLoad = async ({ params }) => {
  const position = await prisma.position.findUnique({
    where: {
      id: params.id,
    },
    include: {
      mandates: {
        include: {
          member: true,
        },
        orderBy: [
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
  });
  if (!position) {
    throw error(404, "Position not found");
  }
  return {
    position,
    mandates: position.mandates,
  };
};

export const actions = {
  update: async ({ params, request, locals }) => {
    const session = await locals.getSession();
    await ctxAccessGuard(apiNames.MANDATE.UPDATE, session?.user);
    const formData = await request.formData();
    const id = formData.get("mandateId");
    if (!id || typeof id !== "string")
      return fail(400, {
        message: "Missing mandate id",
        data: Object.fromEntries(formData),
      });
    try {
      await prisma.mandate.update({
        where: { id: id, positionId: params.id },
        data: {
          startDate: formData.get("startDate")
            ? new Date(formData.get("startDate") as string)
            : undefined,
          endDate: formData.get("endDate")
            ? new Date(formData.get("endDate") as string)
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
          return fail(404, { error: "Mandate not found", data: Object.fromEntries(formData) });
        }
        return fail(500, {
          error: e.message ?? "Unknown error",
          data: Object.fromEntries(formData),
        });
      }
    }
  },
  delete: async ({ params, request, locals }) => {
    const session = await locals.getSession();
    await ctxAccessGuard(apiNames.MANDATE.DELETE, session?.user);
    const formData = await request.formData();
    const id = formData.get("mandateId");
    if (!id || typeof id !== "string")
      return fail(400, {
        message: "Missing mandate id",
        data: Object.fromEntries(formData),
      });
    try {
      await prisma.mandate.delete({
        where: { id: id, positionId: params.id },
      });
      return {
        success: true,
        data: Object.fromEntries(formData),
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2025" || e.code === "2016") {
          return fail(404, { error: "Mandate not found", data: Object.fromEntries(formData) });
        }
        return fail(500, {
          error: e.message ?? "Unknown error",
          data: Object.fromEntries(formData),
        });
      }
    }
  },
};
