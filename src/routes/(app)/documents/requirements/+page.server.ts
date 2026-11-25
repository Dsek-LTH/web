import { PUBLIC_BUCKETS_FILES } from "$env/static/public";
import { fileHandler } from "$lib/files";
import type { FileData } from "$lib/files/fileHandler";
import {
  getRequirementProfileFiles,
  getRequirementProfileFolder,
} from "../requirementProfiles.server";
import * as m from "$paraglide/messages";
import { fail } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { message, superValidate } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { getYearOrThrowSvelteError } from "$lib/utils/url.server";
import { deleteFileSchema } from "../schemas";

export type FolderType = {
  id: string;
  name: string;
  isFolder: boolean;
  url: string;
  files: FolderType[];
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const { user } = locals;
  const year = getYearOrThrowSvelteError(url);
  const files = await getRequirementProfileFiles(user, year);
  const filesGroupedByFolder = files.reduce<Record<string, FileData[]>>(
    (acc, file) => {
      const folder =
        getRequirementProfileFolder(file.id) ?? m.documents_unknown();
      if (!acc[folder]) acc[folder] = [];
      acc[folder]?.push(file);
      return acc;
    },
    {},
  );
  return {
    files,
    folders: filesGroupedByFolder,
    year,
    deleteForm: await superValidate(zod4(deleteFileSchema)),
  };
};

export const actions: Actions = {
  deleteFile: async ({ request, locals }) => {
    const { user } = locals;
    const form = await superValidate(request, zod4(deleteFileSchema));
    if (!form.valid) return fail(400, { form });
    const { id } = form.data;
    await fileHandler.remove(user, PUBLIC_BUCKETS_FILES, [id]);
    return message(form, {
      message: m.documents_fileDeleted(),
      type: "success",
    });
  },
};
