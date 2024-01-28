import type { AvailableLanguageTag } from "$paraglide/runtime";
import { Prisma } from "@prisma/client";

type ModelFields = Partial<{
  [Model in keyof Prisma.TypeMap["model"]]: (keyof Prisma.TypeMap["model"][Model]["fields"])[];
}>;

const translatedModelFields = {
  Alert: ["message", "messageEn"],
  ArticleRequest: ["notificationBody", "notificationBodyEn"],
  Article: ["header", "headerEn", "body", "bodyEn"],
  BookableCategory: ["name", "nameEn"],
  Bookable: ["name", "nameEn"],
  Committee: ["name", "nameEn", "description", "descriptionEn"],
  CustomAuthor: ["name", "nameEn"],
  Event: [
    "title",
    "titleEn",
    "description",
    "descriptionEn",
    "shortDescription",
    "shortDescriptionEn",
  ],
  Markdown: ["markdown", "markdownEn"],
  Position: ["name", "nameEn", "description", "descriptionEn"],
  Tag: ["name", "nameEn"],
} as const satisfies ModelFields;

export default (lang: AvailableLanguageTag) =>
  Prisma.defineExtension({
    name: "translations",
    query: {
      $allModels: {
        // Redirect all write operations to the translated fields
        $allOperations({ model, args, query }) {
          if (model in translatedModelFields && "data" in args && args.data) {
            const fields =
              translatedModelFields[
                model as keyof typeof translatedModelFields
              ];
            const data = Object.entries(args.data)
              .map(([key, value]) => {
                if ((fields as string[]).includes(key) && lang === "en") {
                  return {
                    [`${key}En`]: value,
                  };
                }
                return { [key]: value };
              })
              .reduce((acc, curr) => ({ ...acc, ...curr }), {});
            args.data = data;
          }
          return query(args);
        },
      },
    },
    // Redirect all read operations to the translated fields
    result: Object.entries(translatedModelFields).reduce(
      (acc, [model, fields]) => ({
        ...acc,
        [model.toLowerCase()]: fields
          .filter((field) => !field.endsWith("En"))
          .reduce(
            (acc, field) => ({
              ...acc,
              [field]: {
                needs: { [field]: true, [`${field}En`]: true },
                compute(data: { [x: string]: unknown }) {
                  return lang === "en" && data[`${field}En`]
                    ? data[`${field}En`]
                    : data[field];
                },
              },
            }),
            {},
          ),
      }),
      {},
    ),
  });
