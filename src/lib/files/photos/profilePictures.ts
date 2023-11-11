import type { Context } from "$lib/utils/access";
import { removeFilesWithoutAccessCheck } from "$lib/files/fileHandler";

const removeMyProfilePicture = (ctx: Context, fileName: string) => {
  const bucket = "members";
  if (!ctx?.student_id) throw new Error("You are not logged in");
  if (!fileName.includes(ctx.student_id))
    throw new Error("You are not allowed to delete this file");
  return removeFilesWithoutAccessCheck(ctx, bucket, [fileName]);
};

export const profilePictues = {
  removeMy: removeMyProfilePicture,
};
