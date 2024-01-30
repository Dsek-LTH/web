// In the top-level route folder [[lang=lang]], the =lang part
// refers to the match function in this file.
import { isAvailableLanguageTag } from "$paraglide/runtime";
export const match = isAvailableLanguageTag;
