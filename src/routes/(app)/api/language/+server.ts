import { json } from "@sveltejs/kit";
import { z } from "zod";
import type { RequestHandler } from "./$types";

const schema = z.object({ language: z.enum(["sv", "en"]) });

/**
 * Persists the member's language preference. The `custom-userPreference`
 * paraglide strategy reads this on every request, so without this the
 * locale cookie set by the client is immediately overwritten server-side.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  const { language } = schema.parse(await request.json());
  if (locals.user.studentId) {
    await locals.prisma.member.update({
      where: { studentId: locals.user.studentId },
      data: { language },
    });
  }
  return json({ ok: true });
};
