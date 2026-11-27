import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { roleLogoMap } from "$lib/utils/roleLogos";
import { fail } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";

const pathSchema = z.object({
  path: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9._-]+$/),
});

const saveSchema = pathSchema.extend({
  logoUrl: z.string().trim(),
});

const logoSource = (path: string, logos: Map<string, string>) => {
  const parts = path.split(".");
  for (let i = parts.length; i > 0; i--) {
    const ancestor = parts.slice(0, i).join(".");
    const logoUrl = logos.get(ancestor);
    if (logoUrl) return { path: ancestor, logoUrl };
  }
  return null;
};

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;
  authorize(apiNames.POSITION.UPDATE, user);

  const [positions, roleLogos] = await Promise.all([
    prisma.position.findMany({ select: { id: true }, orderBy: { id: "asc" } }),
    prisma.roleLogo.findMany(),
  ]);

  const logos = roleLogoMap(roleLogos);
  const paths = new Set<string>();
  for (const position of positions) {
    const parts = position.id.split(".");
    for (let i = 1; i <= parts.length; i++) {
      paths.add(parts.slice(0, i).join("."));
    }
  }

  const nodes = [...paths].sort().map((path) => {
    const ownLogoUrl = logos.get(path) ?? "";
    const source = logoSource(path, logos);
    return {
      path,
      depth: path.split(".").length - 1,
      ownLogoUrl,
      effectiveLogoUrl: source?.logoUrl ?? "",
      inheritedFrom:
        source && source.path !== path && ownLogoUrl === "" ? source.path : "",
    };
  });

  return { nodes };
};

export const actions: Actions = {
  save: async ({ locals, request }) => {
    const { prisma, user } = locals;
    authorize(apiNames.POSITION.UPDATE, user);
    const form = await superValidate(request, zod4(saveSchema));
    if (!form.valid) return fail(400, { form });

    if (form.data.logoUrl === "") {
      await prisma.roleLogo.deleteMany({ where: { path: form.data.path } });
    } else {
      await prisma.roleLogo.upsert({
        where: { path: form.data.path },
        update: { logoUrl: form.data.logoUrl },
        create: { path: form.data.path, logoUrl: form.data.logoUrl },
      });
    }
  },
  reset: async ({ locals, request }) => {
    const { prisma, user } = locals;
    authorize(apiNames.POSITION.UPDATE, user);
    const form = await superValidate(request, zod4(pathSchema));
    if (!form.valid) return fail(400, { form });
    await prisma.roleLogo.deleteMany({ where: { path: form.data.path } });
  },
};
