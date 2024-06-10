import {
  PUBLIC_BUCKETS_DOCUMENTS,
  PUBLIC_BUCKETS_FILES,
} from "$env/static/public";
import { fileHandler } from "$lib/files";
import type { FileData } from "$lib/files/fileHandler.js";
import { error, fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";

export type DocumentType =
  | "board-meeting"
  | "guild-meeting"
  | "SRD-meeting"
  | "other";
const prefixByType: Record<DocumentType, string> = {
  "board-meeting": "S",
  "guild-meeting": "",
  "SRD-meeting": "Möte ",
  other: "",
};
export const load: PageServerLoad = async ({ locals, url }) => {
  const { user } = locals;
  const year = url.searchParams.get("year") || new Date().getFullYear();
  const type: DocumentType =
    (url.searchParams.get("type") as DocumentType) || "board-meeting";

  const files = await fileHandler.getInBucket(
    user,
    PUBLIC_BUCKETS_DOCUMENTS,
    "public/" + year + "/" + (prefixByType[type] ?? ""),
    true,
  );
  const SRDfiles = await fileHandler.getInBucket(
    user,
    PUBLIC_BUCKETS_FILES,
    "public/srd/" + year,
    true,
  );

  if (!files) throw error(404, "No files found");
  let filteredFiles = files;
  const oldFormatSRDFiles: FileData[] = [];
  switch (type) {
    case "guild-meeting":
      filteredFiles = files.filter((file) => {
        const fileParts = file.id.split("/");
        const meeting = fileParts[fileParts.length - 2] ?? "unknown";
        return meeting.startsWith("HTM") || meeting.startsWith("VTM");
      });
      break;

    case "SRD-meeting":
      SRDfiles.forEach((file) => {
        const fileParts = file.id.split("/");
        const meeting = fileParts[fileParts.length - 2] ?? "unknown";
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
        const meeting = fileParts[fileParts.length - 2] ?? "unknown";
        return (
          !meeting.startsWith("HTM") &&
          !meeting.startsWith("VTM") &&
          !meeting.startsWith("S") &&
          meeting != year
        );
      });
      break;
  }

  const oldSRDGroupedByMeeting = oldFormatSRDFiles.reduce<
    Record<string, FileData[]>
  >((acc, file) => {
    const fileParts = file.id.split("/");
    const fileName = fileParts[fileParts.length - 1] ?? "unknown";
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
    const meeting = fileParts[fileParts.length - 2] ?? "unknown";
    if (!acc[meeting]) acc[meeting] = [];
    acc[meeting]!.push(file);
    return acc;
  }, oldSRDGroupedByMeeting);
  return {
    files,
    meetings: filesGroupedByMeeting,
    deleteForm: await superValidate(deleteSchema),
  };
};

const deleteSchema = z.object({
  id: z.string(),
});
export type DeleteSchema = typeof deleteSchema;

export const actions: Actions = {
  deleteFile: async ({ request, locals }) => {
    const { user } = locals;
    const form = await superValidate(request, deleteSchema);
    if (!form.valid) return fail(400, { form });
    const { id } = form.data;
    await fileHandler.remove(user, PUBLIC_BUCKETS_DOCUMENTS, [id]);
    return message(form, {
      message: "Fil borttagen",
      type: "success",
    });
  },
};
