import { PUBLIC_BUCKETS_FILES } from "$env/static/public";
import { fileHandler } from "$lib/files";
import type { FileData } from "$lib/files/fileHandler";
import type { AuthUser } from "@zenstackhq/runtime";

const REQUIREMENT_PROFILES_PREFIX = "public/kravprofiler";

export const getRequirementProfileFiles = async (
  user: AuthUser | undefined,
  year?: number,
): Promise<FileData[]> => {
  const prefix = year
    ? `${REQUIREMENT_PROFILES_PREFIX}/${year}`
    : REQUIREMENT_PROFILES_PREFIX;
  return fileHandler
    .getInBucket(user, PUBLIC_BUCKETS_FILES, prefix, true)
    .catch((err) => {
      console.error("Error fetching requirement profiles", err);
      return [];
    });
};

/**
 * Requirement profiles are stored as
 * `public/kravprofiler/<year>/<guild meeting or committee>/<file>`.
 */
export const getRequirementProfileFolder = (fileId: string) => {
  const parts = fileId.split("/");
  return parts.length > 4 ? parts.slice(3, -1).join("/") : undefined;
};

export const getRequirementProfileFolders = async (
  user: AuthUser | undefined,
): Promise<string[]> => {
  const files = await getRequirementProfileFiles(user);
  return [
    ...new Set(
      files
        .map((file) => getRequirementProfileFolder(file.id))
        .filter(
          (folder): folder is string => !!folder && !folder.includes("/"),
        ),
    ),
  ].sort((a, b) => a.localeCompare(b));
};
