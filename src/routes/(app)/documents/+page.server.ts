import {
  PUBLIC_BUCKETS_DOCUMENTS,
  PUBLIC_BUCKETS_FILES,
} from "$env/static/public";
import { fileHandler } from "$lib/files";
import type { FileData } from "$lib/files/fileHandler";
import { error, fail } from "@sveltejs/kit";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import * as m from "$paraglide/messages";
import { getYearOrThrowSvelteError } from "$lib/utils/url.server";

const validDocumentTypes = [
  "board-meeting",
  "guild-meeting",
  "SRD-meeting",
  "other",
] as const;
export type DocumentType = (typeof validDocumentTypes)[number];

const prefixByType: Record<DocumentType, string> = {
  "board-meeting": "S",
  "guild-meeting": "",
  "SRD-meeting": "Möte ",
  other: "",
};
export const load: PageServerLoad = async ({ locals, url }) => {
  const { user } = locals;
  const year = getYearOrThrowSvelteError(url);

  const type = url.searchParams.get("type") || "board-meeting";
  if (!isValidDocumentType(type)) {
    error(400, m.documents_errors_invalidType());
  }

  const files: FileData[] = await fileHandler
    .getInBucket(
      user,
      PUBLIC_BUCKETS_DOCUMENTS,
      "public/" + year + "/" + (prefixByType[type] ?? ""),
      true,
    )
    .catch((err) => {
      console.error("Error fetching files", err);
      return [];
    });
  const SRDfiles = await fileHandler
    .getInBucket(user, PUBLIC_BUCKETS_FILES, "public/srd/" + year, true)
    .catch((err) => {
      console.error("Error fetching files", err);
      return [];
    });

  let filteredFiles = files;
  const oldFormatSRDFiles: FileData[] = [];
  switch (type) {
    case "guild-meeting":
      filteredFiles = files.filter((file) => {
        const fileParts = file.id.split("/");
        const meeting =
          fileParts[fileParts.length - 2] ?? m.documents_unknown();
        return meeting.startsWith("HTM") || meeting.startsWith("VTM");
      });
      break;

    case "SRD-meeting":
      SRDfiles.forEach((file) => {
        const fileParts = file.id.split("/");
        const meeting =
          fileParts[fileParts.length - 2] ?? m.documents_unknown();
        if (meeting.startsWith("Möte")) {
          filteredFiles.push(file);
        } else {
          oldFormatSRDFiles.push(file);
        }
      });
      break;

    case "other":
      filteredFiles = files.filter((file) => {
        const fileParts = file.id.split("/");
        const meeting =
          fileParts[fileParts.length - 2] ?? m.documents_unknown();
        return (
          !meeting.startsWith("HTM") &&
          !meeting.startsWith("VTM") &&
          !meeting.startsWith("S") &&
          meeting != year.toString()
        );
      });
      break;
  }

  const oldSRDGroupedByMeeting = oldFormatSRDFiles.reduce<
    Record<string, FileData[]>
  >((acc, file) => {
    const fileParts = file.id.split("/");
    const fileName = fileParts[fileParts.length - 1] ?? m.documents_unknown();
    const extensions = ["pdf", "html"];
    const fileExtension = extensions.find((ext) => fileName.endsWith(ext));
    const meeting = fileName.substring(
      0,
      fileName.length - (fileExtension ? fileExtension.length : 0),
    );

    if (!acc[meeting]) acc[meeting] = [];
    acc[meeting]!.push(file);
    return acc;
  }, {});

  const filesGroupedByMeeting = filteredFiles.reduce<
    Record<string, FileData[]>
  >((acc, file) => {
    const fileParts = file.id.split("/");
    const meeting = fileParts[fileParts.length - 2] ?? m.documents_unknown();
    if (!acc[meeting]) acc[meeting] = [];
    acc[meeting]!.push(file);
    return acc;
  }, oldSRDGroupedByMeeting);
  return {
    files,
    meetings: filesGroupedByMeeting,
    deleteForm: await superValidate(zod(deleteSchema)),
  };
};

const deleteSchema = z.object({
  id: z.string(),
});
export type DeleteSchema = Infer<typeof deleteSchema>;

export const actions: Actions = {
  deleteFile: async ({ request, locals }) => {
    const { user } = locals;
    const form = await superValidate(request, zod(deleteSchema));
    if (!form.valid) return fail(400, { form });
    const { id } = form.data;
    await fileHandler.remove(user, PUBLIC_BUCKETS_DOCUMENTS, [id]);
    return message(form, {
      message: m.documents_fileDeleted(),
      type: "success",
    });
  },
};

const isValidDocumentType = (type: string): type is DocumentType =>
  (validDocumentTypes as unknown as string[]).includes(type);
