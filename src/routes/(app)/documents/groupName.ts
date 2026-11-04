import { z } from "zod";
import * as m from "$paraglide/messages";

export const groupNameSchema = z
  .string()
  .trim()
  .max(80)
  .refine(
    (value) =>
      value === "" ||
      (!value.includes("/") && !value.includes("\\") && !value.includes("..")),
    { message: m.documents_errors_invalidGroup() },
  );
