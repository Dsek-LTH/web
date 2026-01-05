import {
  PUBLIC_BUCKETS_DOCUMENTS,
  PUBLIC_BUCKETS_FILES,
} from "$env/static/public";
import { fileHandler } from "$lib/files";
import type { FileData } from "$lib/files/fileHandler";
import * as m from "$paraglide/messages";
import { fail } from "@sveltejs/kit";
import type { Infer } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { getYearOrThrowSvelteError } from "$lib/utils/url.server";

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
  const files = await fileHandler
    .getInBucket(
      user,
      PUBLIC_BUCKETS_FILES,
      "public/kravprofiler/" + year,
      true,
    )
    .catch((err) => {
      console.error("Error fetching files", err);
      return [];
    });
  const filesGroupedByFolder = files.reduce<Record<string, FileData[]>>(
    (acc, file) => {
      const fileParts = file.id.split("/");
      const folder = //get the folder structure starting 2 "steps" in, we don't want the requirements/[year] part of the filepath
        fileParts.slice(2, fileParts.length - 1).join("/") ??
        m.documents_unknown();
      if (!acc[folder]) acc[folder] = [];
      acc[folder]?.push(file);
      return acc;
    },
    {},
  );
  return {
    files,
    folders: filesGroupedByFolder,
    deleteForm: await superValidate(zod4(deleteSchema)),
  };
};

const deleteSchema = z.object({
  id: z.string(),
});
export type DeleteSchema = Infer<typeof deleteSchema>;

export const actions: Actions = {
  deleteFile: async ({ request, locals }) => {
    const { user } = locals;
    const form = await superValidate(request, zod4(deleteSchema));
    if (!form.valid) return fail(400, { form });
    const { id } = form.data;
    await fileHandler.remove(user, PUBLIC_BUCKETS_DOCUMENTS, [id]);
    return message(form, {
      message: m.documents_fileDeleted(),
      type: "success",
    });
  },
};
