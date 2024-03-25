import { Prisma } from "@prisma/client";
import { error } from "@sveltejs/kit";

/**
 * Wrap a soft delete function in a try-catching block.
 * This is a workaround to known issue with ZenStack: https://github.com/zenstackhq/zenstack/issues/687
 * @param deleteFn - The function to wrap
 */
export default async <T>(deleteFn: () => Promise<T>) => {
  await deleteFn().catch((e) => {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // This means that the operation succeeded, but the result was not readable after the operation.
      // We don't expect the result to be readable after a delete operation, so we can safely ignore this error.
      // See https://zenstack.dev/docs/reference/error-handling
      if (e.code === "P2004" && e?.meta?.["reason"] === "RESULT_NOT_READABLE") {
        return;
      }
    }
    throw error(500, "Failed to delete record");
  });
};
