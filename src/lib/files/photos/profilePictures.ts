import { removeFilesWithoutAccessCheck } from "$lib/files/fileHandler";
import { error } from "@sveltejs/kit";
import type { AuthUser } from "@zenstackhq/runtime";

export const removeMyProfilePicture = (fileName: string, ctx?: AuthUser) => {
  const bucket = "members";
  if (!ctx?.studentId) throw error(401, "You are not logged in");
  if (!fileName.includes(ctx.studentId))
    throw error(403, "You are not allowed to delete this file");
  return removeFilesWithoutAccessCheck(ctx, bucket, [fileName]);
};
