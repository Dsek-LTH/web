import { fileHandler } from "$lib/files";
import type { FileData } from "$lib/files/fileHandler.js";
import { ctxAccessGuard } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import { error, fail } from "@sveltejs/kit";

export type DocumentType = "board-meeting" | "guild-meeting" | "other";
const prefixByType: Record<DocumentType, string> = {
  "board-meeting": "S",
  "guild-meeting": "",
  other: "",
};
export const load = async ({ parent, url }) => {
  const { session } = await parent();
  const year = url.searchParams.get("year") || new Date().getFullYear();
  const type: DocumentType = (url.searchParams.get("type") as DocumentType) || "board-meeting";
  const files = await fileHandler.getInBucket(
    session?.user,
    "dev-documents",
    year + "/" + (prefixByType[type] ?? ""),
    true
  );
  if (!files) throw error(404, "No files found");
  let filteredFiles = files;
  switch (type) {
    case "guild-meeting":
      filteredFiles = files.filter((file) => {
        const fileParts = file.id.split("/");
        const meeting = fileParts[fileParts.length - 2] ?? "unknown";
        return meeting.startsWith("HTM") || meeting.startsWith("VTM");
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
  const filesGroupedByMeeting = filteredFiles.reduce<Record<string, FileData[]>>((acc, file) => {
    const fileParts = file.id.split("/");
    const meeting = fileParts[fileParts.length - 2] ?? "unknown";
    if (!acc[meeting]) acc[meeting] = [];
    acc[meeting]!.push(file);
    return acc;
  }, {});
  return {
    files,
    meetings: filesGroupedByMeeting,
  };
};

export const actions = {
  deleteFile: async ({ request, locals }) => {
    const session = await locals.getSession();
    await ctxAccessGuard(apiNames.FILES.BUCKET("dev-documents").DELETE, session?.user);
    const formData = await request.formData();
    const id = formData.get("id");
    if (!id || typeof id !== "string")
      return fail(400, {
        message: "Missing mandate id",
        data: Object.fromEntries(formData),
      });
    try {
      await fileHandler.remove(session?.user, "dev-documents", [id]);
      return {
        success: true,
        data: Object.fromEntries(formData),
      };
    } catch {
      return fail(500, {
        error: "Unknown error",
        data: Object.fromEntries(formData),
      });
    }
  },
};
