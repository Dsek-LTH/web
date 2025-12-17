import { z } from "zod";

const VALID_DOMAINS = [
  "dsek.se",
  "nolla.nu",
  "teknikfokus.se",
  "dchip.se",
] as const;

const emailSchema = z.string().email();

export const emailFormSchema = z.object({
  email: emailSchema,
});

export const emailAliasSchema = z
  .object({
    alias: z.string(),
    domain: z.enum(VALID_DOMAINS),
  })
  .refine(
    (data) => {
      const email = `${data.alias}@${data.domain}`;
      return emailSchema.safeParse(email).success;
    },
    {
      message: "Invalid email address",
      path: ["alias"],
    },
  );
