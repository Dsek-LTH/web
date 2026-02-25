/**
 * Checks if key is a key of object.
 * Use this function to narrow down the type of a key,
 * since TypeScript doesn't do that automatically with `in`.
 *
 * See https://github.com/microsoft/TypeScript/issues/43284.
 */
const in_ = <K extends string, O extends object>(
	key: K,
	object: O,
): key is K & keyof O => key in object;

export default in_;
