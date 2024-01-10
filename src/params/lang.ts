// https://kit.svelte.dev/docs/advanced-routing#matching
// https://inlang.com/g/2fg8ng94/guide-nilsjacobsen-buildAGlobalSvelteApp#adding-a-language-parameter
import {
  availableLanguageTags,
  type AvailableLanguageTag,
} from "$paraglide/runtime";

export const match = (param): param is AvailableLanguageTag => {
  return (availableLanguageTags as readonly string[]).includes(param);
};
