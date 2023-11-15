import { fileHandler } from "$lib/files";
import type { FileData } from "$lib/files/fileHandler.js";
import { error } from "@sveltejs/kit";
import { PUBLIC_BUCKETS_DOCUMENTS } from "$env/static/public";

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
    PUBLIC_BUCKETS_DOCUMENTS,
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
