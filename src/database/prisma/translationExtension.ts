import type { AvailableLanguageTag } from "$paraglide/runtime";
import { Prisma } from "@prisma/client";

/** All database models; camelCased to match the Prisma result extension. */
type Models = Uncapitalize<keyof Prisma.TypeMap["model"]>;

/** Takes a camelCased model name and return the fields of that model. */
type Fields<Model extends Models> =
  keyof Prisma.TypeMap["model"][Capitalize<Model>]["fields"];

/** A map of models -> fields -> translated field. */
type ModelFields = {
  [Model in Models]?: {
    [Field in Fields<Model>]?: Exclude<Fields<Model>, Field>;
  };
};

const translatedModelFields: ModelFields = {
  alert: {
    message: "messageEn",
  },
  articleRequest: {
    notificationBody: "notificationBodyEn",
  },
  article: {
    header: "headerEn",
    body: "bodyEn",
  },
  bookableCategory: {
    name: "nameEn",
  },
  bookable: {
    name: "nameEn",
  },
  committee: {
    name: "nameEn",
    description: "descriptionEn",
  },
  customAuthor: {
    name: "nameEn",
  },
  event: {
    title: "titleEn",
    description: "descriptionEn",
    shortDescription: "shortDescriptionEn",
  },
  markdown: {
    markdown: "markdownEn",
  },
  position: {
    name: "nameEn",
    description: "descriptionEn",
  },
  tag: {
    name: "nameEn",
  },
};

/**
 * This Prisma extension redirects all read operations to the translated fields.
 * For example, if the language is English then reading from the
 * `alert.message` field will read from the `alert.messageEn` instead.
 */
export default (lang: AvailableLanguageTag) =>
  Prisma.defineExtension({
    name: "translations",
    result: Object.entries(translatedModelFields).reduce(
      (acc, [model, fieldTranslationMap]) => {
        const modelFields = Object.keys(fieldTranslationMap);
        return {
          ...acc,
          [model]: modelFields.reduce((acc, field) => {
            const translatedField =
              fieldTranslationMap[field as keyof typeof fieldTranslationMap];
            return {
              ...acc,
              [field]: {
                needs: {
                  [field]: true,
                  [translatedField]: true,
                },
                compute(data: { [x: string]: unknown }) {
                  // If the language is English and there is translated text, return it.
                  // Otherwise, return the original text.
                  return lang === "en" && data[translatedField]
                    ? data[translatedField]
                    : data[field];
                },
              },
            };
          }, {}),
        };
      },
      {},
    ),
  });
