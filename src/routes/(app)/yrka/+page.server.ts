import apiNames from "$lib/utils/apiNames";
import { fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { getFullName } from "$lib/utils/client/member";
import nodemailer from "nodemailer";
import { env } from "$env/dynamic/private";
import { authorize } from "$lib/utils/authorization";

const transporter = nodemailer.createTransport({
  host: "mailmaster.blossom.dsek.se",
  secure: true,
  port: 465,
  auth: {
    user: env.EMAIL_YRKA_USER,
    pass: env.EMAIL_YRKA_PASS,
  },
});

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = locals;
  authorize(apiNames.YRKA.SEND, user);
  return {
    form: await superValidate(zod4(createSchema)),
  };
};

const createSchema = z.object({
  title: z.string().min(1).default(""),
  content: z.string().min(1),
});
export const actions: Actions = {
  default: async ({ request, locals }) => {
    const { member } = locals;
    const form = await superValidate(request, zod4(createSchema));
    if (!form) return fail(400, { form });
    const name = member ? getFullName(member) : "Anonym";
    const { title, content } = form.data;
    // send email
    try {
      const result = await transporter.sendMail({
        from: `"${name}" <yrka@dsek.se>`,
        to: "yrka@dsek.se",
        subject: `YRKANDE: ${title}`,
        text: `${content}`,
        html: `<p>${content}</p><p>Från: ${name}</p>`,
      });
      console.log(result);
    } catch (e) {
      console.error(e);
      return message(
        form,
        {
          message: "Kunde inte skicka e-postmeddelande",
          type: "error",
        },
        { status: 500 },
      );
    }
    return message(form, {
      message: "Yrkande skickat!",
      type: "success",
    });
  },
};
