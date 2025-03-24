import type { AvailableLanguageTag } from "$paraglide/runtime";
import { Prisma } from "@prisma/client";
import type { OperationPayload, Types } from "@prisma/client/runtime/library";

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



type PayloadToModel<T> =
  T extends OperationPayload ? Types.Result.DefaultSelection<T> :
    T extends OperationPayload[] ? Types.Result.DefaultSelection<T[number]>[] :
      never;

export type WithRelation<
  T extends keyof Prisma.TypeMap["model"],
  // R extends keyof Prisma.TypeMap["model"][T]["payload"]["objects"]
> =
  PayloadToModel<Prisma.TypeMap["model"][T]["payload"]>
  // {
  //   [K in R]: PayloadToModel<Prisma.TypeMap["model"][T]["payload"]["objects"][K]>
  // };

//type ModelName = "Alert";
//type FieldName = "messageSv";

type FieldType<ModelName extends keyof Prisma.TypeMap["model"], FieldName extends keyof WithRelation<ModelName>> = WithRelation<ModelName>[FieldName];
// const e: FieldType = {}
type f = FieldType<"Article", "bodyEn">
const fe: f[] = []

type MostPrecise<T, U> = T extends U ? T : U;

type h = Prisma.AlertGetPayload<{ select: { [K in keyof Required<Prisma.AlertSelect>]: true } }>
const j: h[] = []
j

type RemoveSuffix<
  Key extends string,
  Suffix extends string
> = Key extends `${infer Prefix}${Suffix}` ? Prefix : never

// type NewModelFields = {
//   [Model in Models]?: {
//     [Field in RemoveSuffix<Extract<Fields<Model>, `${string}Sv`>, 'Sv'>]: {sv: Extract<Fields<Model>, `${Field}Sv`>; en: Extract<Fields<Model>, `${Field}En`>};
//   }
// }
export type NewModelFields = {
  [Model in Models]: {
    // [Field in RemoveSuffix<Extract<Fields<Model>, `${string}Sv`>, 'Sv'>]: {needs: Record<`${Field}Sv` | `${Field}En`, true>, compute(data: Record<string, string | null>): string | null};
    [Field in RemoveSuffix<Extract<Fields<Model>, `${string}Sv`>, 'Sv'>]: {needs: Record<`${Field}Sv` | `${Field}En`, true>, compute(data: Record<string, FieldType<Capitalize<Model>, `${Field}Sv` extends keyof WithRelation<Capitalize<Model>> ? `${Field}Sv` : never> | FieldType<Capitalize<Model>, `${Field}En` extends keyof WithRelation<Capitalize<Model>> ? `${Field}En` : never>>): MostPrecise<FieldType<Capitalize<Model>, `${Field}Sv` extends keyof WithRelation<Capitalize<Model>> ? `${Field}Sv` : never>, FieldType<Capitalize<Model>, `${Field}En` extends keyof WithRelation<Capitalize<Model>> ? `${Field}En` : never>>};
  }
}

const models = Prisma.dmmf.datamodel.models;
const newTranslatedModelFields: {[key: string]: {[key: string]: {needs: {[key: string]: boolean}, compute(data: Record<string, string | null>): string | null}}} = {};

export const test4 = (lang: AvailableLanguageTag): NewModelFields => {
  console.log('extension:', lang)
  models.forEach(model => {
    const modelName = model.name.charAt(0).toLowerCase() + model.name.slice(1);
    const fieldsWithTranslations: {[key: string]: {needs: {[key: string]: boolean}, compute(data: Record<string, string | null>): string | null}} = {};
    let hasTranslations = false;

    model.fields.forEach(field => {
      if (field.name.endsWith('Sv')) {
        const baseFieldName = field.name.slice(0, -2);
        const enFieldName = baseFieldName + 'En';
        if (model.fields.some(f => f.name === enFieldName)) {
          fieldsWithTranslations[baseFieldName] = {
            needs: {
              [field.name]: true,
              [enFieldName]: true,
            },
            compute(data) {
              return lang === 'en' && data[enFieldName] ? data[enFieldName] : data[field.name] ?? null;
            }
          };
          hasTranslations = true;
        }
      }
    });

    if (hasTranslations) {
      newTranslatedModelFields[modelName] = fieldsWithTranslations;
    }
  });

  return newTranslatedModelFields as NewModelFields;
}

/**
 * This Prisma extension redirects all read operations to the translated fields.
 * For example, if the language is English then reading from the
 * `alert.message` field will read from the `alert.messageEn` instead.
 */
export default (lang: AvailableLanguageTag) => Prisma.defineExtension({ name: "translations", result: test4(lang) });
