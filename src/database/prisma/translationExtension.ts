import type { AvailableLanguageTag } from "$paraglide/runtime";
import { Prisma } from "@prisma/client";
import type { OperationPayload, Types } from "@prisma/client/runtime/library";

/** All database models; camelCased to match the Prisma result extension. */
type Models = Uncapitalize<keyof Prisma.TypeMap["model"]>;

/** Takes a camelCased model name and return the fields of that model. */
type Fields<Model extends Models> =
	keyof Prisma.TypeMap["model"][Capitalize<Model>]["fields"];

type PayloadToModel<T> = T extends OperationPayload
	? Types.Result.DefaultSelection<T>
	: T extends OperationPayload[]
		? Array<Types.Result.DefaultSelection<T[number]>>
		: never;

type WithRelation<T extends keyof Prisma.TypeMap["model"]> = PayloadToModel<
	Prisma.TypeMap["model"][T]["payload"]
>;

type FieldType<
	ModelName extends keyof Prisma.TypeMap["model"],
	FieldName extends keyof WithRelation<ModelName>,
> = WithRelation<ModelName>[FieldName];

type MostPrecise<T, U> = T extends U ? T : U;

type RemoveSuffix<
	Key extends string,
	Suffix extends string,
> = Key extends `${infer Prefix}${Suffix}` ? Prefix : never;

type FieldTypeLang<
	Model extends Models,
	Field extends RemoveSuffix<Extract<Fields<Model>, `${string}Sv`>, "Sv">,
	Lang extends "Sv" | "En",
> = FieldType<
	Capitalize<Model>,
	`${Field}${Lang}` extends keyof WithRelation<Capitalize<Model>>
		? `${Field}${Lang}`
		: never
>;

/** All models with their translated fields in the format the prisma extension expects.
 * @example
 * Model = "alert"
 * -> Fields<Model> = ["messageSv", "messageEn", ...]
 * -> Field = "message"
 * -> {
 *   needs = { messageSv: true, messageEn: true }
 *   compute = (data) => lang === "en" ? data.messageEn : data.messageSv
 * }
 */
type ModelFields = {
	[Model in Models]: {
		[Field in RemoveSuffix<Extract<Fields<Model>, `${string}Sv`>, "Sv">]: {
			needs: Record<`${Field}Sv` | `${Field}En`, true>;
			compute(
				data: Record<
					string,
					FieldTypeLang<Model, Field, "Sv"> | FieldTypeLang<Model, Field, "En">
				>,
			): MostPrecise<
				FieldTypeLang<Model, Field, "Sv">,
				FieldTypeLang<Model, Field, "En">
			>;
		};
	};
};

type ComputedModelFields<Model extends Models> = {
	[Field in RemoveSuffix<
		Extract<Fields<Model>, `${string}Sv`>,
		"Sv"
	>]: MostPrecise<
		FieldTypeLang<Model, Field, "Sv">,
		FieldTypeLang<Model, Field, "En">
	>;
};

type TranslatedModelField = Record<
	string,
	{
		needs: Record<string, boolean>;
		compute(data: Record<string, string | null>): string | null;
	}
>;

const models = Prisma.dmmf.datamodel.models;
const translatedModelFields: Record<string, TranslatedModelField> = {};

const modelFields = (lang: AvailableLanguageTag): ModelFields => {
	models.forEach((model) => {
		const modelName = model.name.charAt(0).toLowerCase() + model.name.slice(1);
		const fieldsWithTranslations: TranslatedModelField = {};
		let hasTranslations = false;

		model.fields.forEach((field) => {
			if (field.name.endsWith("Sv")) {
				const baseFieldName = field.name.slice(0, -2);
				const enFieldName = baseFieldName + "En";
				if (model.fields.some((f) => f.name === enFieldName)) {
					fieldsWithTranslations[baseFieldName] = {
						needs: {
							[field.name]: true,
							[enFieldName]: true,
						},
						compute(data) {
							return lang === "en" && data[enFieldName]
								? data[enFieldName]
								: (data[field.name] ?? null);
						},
					};
					hasTranslations = true;
				}
			}
		});

		if (hasTranslations) {
			translatedModelFields[modelName] = fieldsWithTranslations;
		}
	});

	return translatedModelFields as ModelFields;
};

/** Use this instead of the regular types from `@prisma/client`.
 * `ExtendedPrismaModel<"Article">` will have every field on the `Article`
 * model and the computed fields from the translation extension.
 */
export type ExtendedPrismaModel<Model extends keyof Prisma.TypeMap["model"]> = {
	[Field in keyof WithRelation<Model>]: FieldType<Model, Field>;
} & ComputedModelFields<Uncapitalize<Model>>;

/**
 * This Prisma extension redirects all read operations to the translated fields.
 * For example, if the language is English then reading from the
 * `alert.message` field will read from `alert.messageEn`.
 */
export default (lang: AvailableLanguageTag) =>
	Prisma.defineExtension({ name: "translations", result: modelFields(lang) });
