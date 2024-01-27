import apiNames from "$lib/utils/apiNames";
import { fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { getCurrentMember } from "$lib/utils/member";
import { getFullName } from "$lib/utils/client/member";
import nodemailer from "nodemailer";
import { EMAIL_YRKA_PASS, EMAIL_YRKA_USER } from "$env/static/private";
import { authorize } from "$lib/utils/authorization";

const transporter = nodemailer.createTransport({
  host: "mailmaster.blossom.dsek.se",
  secure: true,
  port: 465,
  auth: {
    user: EMAIL_YRKA_USER,
    pass: EMAIL_YRKA_PASS,
  },
});

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = locals;
  authorize(apiNames.YRKA.SEND, user);
  return {
    form: await superValidate(createSchema),
  };
};

const createSchema = z.object({
  title: z.string().min(1).default(""),
  content: z.string().min(1),
});
export const actions: Actions = {
  default: async ({ request, locals }) => {
    const { prisma, user } = locals;
    const form = await superValidate(request, createSchema);
    if (!form) return fail(400, { form });
    const member = await getCurrentMember(prisma, user);
    const name = getFullName(member);
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
