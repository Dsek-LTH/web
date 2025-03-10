import { createDirectus, readItems, rest, staticToken } from "@directus/sdk";
import { readItem } from "@directus/sdk";
import { env as publicEnv } from "$env/dynamic/public";
import { env as privateEnv } from "$env/dynamic/private";
import type { AvailableLanguageTag } from "$paraglide/runtime";

export const getDirectusInstance = (fetch: any) => {
  const options = fetch ? { globals: { fetch } } : {};
  const directus = createDirectus(
    publicEnv.PUBLIC_DIRECTUS_API_URL ?? "",
    options,
  )
    .with(staticToken(privateEnv.DIRECTUS_TOKEN))
    .with(rest());

  return directus;
};

export const getNollningPageData = async (
  fetch: any,
  collection: string,
  language: AvailableLanguageTag,
  version: string,
) => {
  let res;
  try {
    res = await getDirectusInstance(fetch).request(
      readItem(collection, 1, {
        deep: {
          translations: {
            _filter: {
              languages_code: {
                _eq: language,
              },
            },
          },
        },
        fields: ["translations.*", "*"],
        version: version,
      }),
    );
    res = { ...res, ...res["translations"][0] };
  } catch (e) {
    console.log(e);
  }
  return res;
};

export const getNollningCollectionData = async (
  fetch: any,
  collection: string,
  language: AvailableLanguageTag,
  version: string,
) => {
  let res;
  try {
    res = await getDirectusInstance(fetch).request(
      readItems(collection, {
        deep: {
          translations: {
            _filter: {
              languages_code: {
                _eq: language,
              },
            },
          },
        },
        fields: ["translations.*", "*"],
        version: version,
      }),
    );
    res = res.map((r) => ({ ...r, ...r["translations"][0] }));
  } catch (e) {
    console.log(e);
  }
  return res ?? [];
};
