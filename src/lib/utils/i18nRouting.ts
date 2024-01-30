import {
  sourceLanguageTag,
  type AvailableLanguageTag,
  availableLanguageTags,
} from "$paraglide/runtime";

/**
 * Returns the path in the given language, regardless of which language the path is in.
 */
export function route(path: string, lang: AvailableLanguageTag) {
  path = withoutLanguageTag(path);

  // Don't prefix the default language
  if (lang === sourceLanguageTag) return path;

  // Prefix all other languages
  return `/${lang}${path}`;
}

/**
 * Returns the path without the language tag
 */
function withoutLanguageTag(path: string) {
  const [, maybeLang, ...rest] = path.split("/");
  if (availableLanguageTags.includes(maybeLang as AvailableLanguageTag)) {
    return `/${rest.join("/")}`;
  }
  return path;
}
