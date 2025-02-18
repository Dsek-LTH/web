import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import type { Dbay, PrismaClient } from "@prisma/client";
import { type Action } from "@sveltejs/kit";
import { fail, superValidate, type Infer } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";

export const getAllDbay = async (prisma: PrismaClient): Promise<Dbay[]> => {
  const dbay = await prisma.dbay.findMany();
  return dbay;
};

const createDbaySchema = z.object({
  header: z.string().min(1, "Title cannot be empty"),
  body: z.string().default(""),
  price: z.number().int().nonnegative(),
});
export type createDbaySchema = Infer<typeof createDbaySchema>;

export const create: Action = async (event) => {
  const { request, locals } = event;
  const { prisma, user } = locals;
  authorize(apiNames.MEMBER.CREATE, user);
  const form = await superValidate(request, zod(createDbaySchema));
  if (!form.valid) return fail(400, { form });
  await prisma.dbay.create({ data: form.data });
};
