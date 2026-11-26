import { z } from "zod";
import * as m from "$paraglide/messages";

export const isSafePathSegment = (value: string) =>
  value !== "." &&
  !value.includes("/") &&
  !value.includes("\\") &&
  !value.includes("..");

export const groupNameSchema = z
  .string()
  .trim()
  .max(80)
  .refine((value) => value === "" || isSafePathSegment(value), {
    message: m.documents_errors_invalidGroup(),
  });
