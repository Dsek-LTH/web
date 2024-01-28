import { parse, stringify } from "superjson";

/**
 * This boilerplate is Prisma's fault, see https://github.com/prisma/prisma/issues/20627.
 *
 * Removes symbols from object by serializing using superjson.
 * Needed for all models containing computed fields.
 * @param obj Any object
 */
export default <T>(obj: T) => {
  return parse<T>(stringify(obj));
};
