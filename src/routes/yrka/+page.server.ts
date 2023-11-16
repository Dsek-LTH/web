import { policyAccessGuard, withAccess } from "$lib/utils/access.js";
import apiNames from "$lib/utils/apiNames.js";
import { fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { PageServerLoad } from "./$types.js";
import { getCurrentMember } from "$lib/utils/member.js";
import { getFullName } from "$lib/utils/client/member.js";
import nodemailer from "nodemailer";
import { EMAIL_YRKA_PASS, EMAIL_YRKA_USER } from "$env/static/private";

const transporter = nodemailer.createTransport({
  host: "dsek.se",
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_YRKA_USER,
    pass: EMAIL_YRKA_PASS,
  },
});

export const load: PageServerLoad = async ({ parent }) => {
  const { accessPolicies } = await parent();
  await policyAccessGuard(apiNames.YRKA.SEND, accessPolicies);
  return {
    form: await superValidate(createSchema),
  };
};

const createSchema = z.object({
  title: z.string().min(1).default(""),
  content: z.string().min(1),
});
export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, createSchema);
    if (!form) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.YRKA.SEND,
      session?.user,
      async () => {
        const member = await getCurrentMember(session?.user);
        const name = getFullName(session?.user, member);
        const { title, content } = form.data;
        // send email
        try {
          await transporter.sendMail({
            from: `"${name}" <yrkande@dsek.se>`,
            to: "yrka@dsek.se",
            subject: `YRKANDE: ${title}`,
            text: `${content}`,
            html: `<p>${content}</p><p>Från: ${name}</p>`,
          });
        } catch {
          return message(
            form,
            {
              message: "Kunde inte skicka e-postmeddelande",
              type: "error",
            },
            { status: 500 }
          );
        }
        return message(form, {
          message: "Yrkande skickat!",
          type: "success",
        });
      },
      form
    );
  },
};
