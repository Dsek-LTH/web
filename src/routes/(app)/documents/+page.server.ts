import {
  PUBLIC_BUCKETS_DOCUMENTS,
  PUBLIC_BUCKETS_FILES,
} from "$env/static/public";
import { fileHandler } from "$lib/files";
import type { FileData } from "$lib/files/fileHandler";
import { error, fail, isHttpError } from "@sveltejs/kit";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import * as m from "$paraglide/messages";
import { getYearOrThrowSvelteError } from "$lib/utils/url.server";
import {
  getMeetingFolder,
  getTargetFolder,
  groupDocuments,
  type DocumentMeeting,
} from "./grouping";
import { DocumentTypes as dt } from "./types";
import { deleteFileSchema } from "./schemas";
import { groupNameSchema } from "./groupName";

const validDocumentTypes = [
  dt.boardMeeting,
  dt.guildMeeting,
  dt.SRDMeeting,
  dt.other,
] as const;
export type DocumentType = (typeof validDocumentTypes)[number];

const prefixByType: Record<dt, string> = {
  [dt.boardMeeting]: "S",
  [dt.guildMeeting]: "",
  [dt.SRDMeeting]: "Möte ",
  [dt.other]: "",
};
export const load: PageServerLoad = async ({ locals, url }) => {
  const { user } = locals;
  const year = getYearOrThrowSvelteError(url);

  const type = url.searchParams.get("type") || dt.boardMeeting;
  if (!isValidDocumentType(type)) {
    throw error(400, m.documents_errors_invalidType());
  }

  const documentsFiles: FileData[] = await fileHandler
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

  const documentMeetings = groupDocuments(documentsFiles, `public/${year}/`);

  let meetings: DocumentMeeting[];
  switch (type) {
    case dt.guildMeeting:
      meetings = documentMeetings.filter(
        (meeting) =>
          meeting.name.startsWith("HTM") || meeting.name.startsWith("VTM"),
      );
      break;

    case dt.SRDMeeting: {
      const srdFiles: FileData[] = await fileHandler
        .getInBucket(user, PUBLIC_BUCKETS_FILES, "public/srd/" + year, true)
        .catch((err) => {
          console.error("Error fetching files", err);
          return [];
        });
      const srdMeetings = groupDocuments(srdFiles, `public/srd/${year}/`, {
        oldSrdFormat: true,
        meetingFilter: (name) =>
          name.startsWith("SRD") || name.startsWith("Möte"),
      });
      meetings = mergeMeetings([...documentMeetings, ...srdMeetings]);
      break;
    }

    case dt.other:
      meetings = documentMeetings.filter(
        (meeting) =>
          !meeting.name.startsWith("HTM") &&
          !meeting.name.startsWith("VTM") &&
          !meeting.name.startsWith("S") &&
          meeting.name !== String(year),
      );
      break;

    default:
      meetings = documentMeetings;
  }

  return {
    meetings,
    deleteForm: await superValidate(zod4(deleteSchema)),
    editForm: await superValidate(zod4(editFileSchema)),
  };
};

function mergeMeetings(meetings: DocumentMeeting[]): DocumentMeeting[] {
  const merged = new Map<string, DocumentMeeting>();

  for (const meeting of meetings) {
    const existing = merged.get(meeting.name);
    if (!existing) {
      merged.set(meeting.name, {
        name: meeting.name,
        files: [...meeting.files],
        groups: meeting.groups.map((group) => ({
          ...group,
          files: [...group.files],
        })),
      });
      continue;
    }

    existing.files.push(...meeting.files);
    for (const group of meeting.groups) {
      const existingGroup = existing.groups.find(
        (candidate) => candidate.name === group.name,
      );
      if (existingGroup) {
        existingGroup.files.push(...group.files);
      } else {
        existing.groups.push({ ...group, files: [...group.files] });
      }
    }
  }

  for (const meeting of merged.values()) {
    meeting.groups.sort((a, b) => {
      if (a.name === null) return 1;
      if (b.name === null) return -1;
      return a.name.localeCompare(b.name, "sv");
    });
  }

  return [...merged.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "sv"),
  );
}

const documentBuckets = [
  PUBLIC_BUCKETS_DOCUMENTS,
  PUBLIC_BUCKETS_FILES,
] as const;

const deleteSchema = deleteFileSchema.extend({
  // Meeting documents live in the documents bucket, but SRD meeting documents
  // live in the files bucket. The bucket must be sent along with the file id.
  bucket: z.enum(documentBuckets),
});

const editFileSchema = z.object({
  id: z.string().min(1),
  bucket: z.enum(documentBuckets),
  name: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .refine(
      (value) =>
        !value.includes("/") && !value.includes("\\") && !value.includes(".."),
      { message: m.documents_errors_invalidFileName() },
    ),
  group: groupNameSchema.default(""),
});
export type EditSchema = Infer<typeof editFileSchema>;

export const actions: Actions = {
  deleteFile: async ({ request, locals }) => {
    const { user } = locals;
    const form = await superValidate(request, zod4(deleteSchema));
    if (!form.valid) return fail(400, { form });
    const { id, bucket } = form.data;
    await fileHandler.remove(user, bucket, [id]);
    return message(form, {
      message: m.documents_fileDeleted(),
      type: "success",
    });
  },

  editFile: async ({ request, locals }) => {
    const { user } = locals;
    const form = await superValidate(request, zod4(editFileSchema));
    if (!form.valid) return fail(400, { form });

    const { id, bucket, name, group } = form.data;
    const isOldSrdFile =
      bucket === PUBLIC_BUCKETS_FILES &&
      id.startsWith("public/srd/") &&
      id.split("/").length === 4;
    const meetingFolder = isOldSrdFile
      ? id.split("/").slice(0, 3).join("/")
      : getMeetingFolder(
          id,
          bucket,
          PUBLIC_BUCKETS_DOCUMENTS,
          PUBLIC_BUCKETS_FILES,
        );
    if (!meetingFolder) {
      return message(
        form,
        { message: m.documents_errors_invalidFileName(), type: "error" },
        { status: 400 },
      );
    }
    if (isOldSrdFile && group) {
      return message(
        form,
        { message: m.documents_errors_oldSrdGroup(), type: "error" },
        { status: 400 },
      );
    }

    const currentFolder = id.split("/").slice(0, -1).join("/");
    const currentName = id.split("/").at(-1)!;
    const targetFolder = getTargetFolder(meetingFolder, group);
    let currentId = id;

    try {
      if (targetFolder !== currentFolder) {
        const moved = await fileHandler.move(
          user,
          bucket,
          [currentId],
          targetFolder,
        );
        const movedFile = moved.find((change) => !change.file.isDir);
        if (!movedFile) {
          return message(
            form,
            { message: m.documents_errors_fileExists(), type: "error" },
            { status: 409 },
          );
        }
        currentId = movedFile.file.id;
      }

      if (name !== currentName) {
        await fileHandler.rename(user, bucket, currentId, name);
      }
    } catch (e) {
      if (isHttpError(e) && e.status === 409) {
        return message(
          form,
          { message: m.documents_errors_fileExists(), type: "error" },
          { status: 409 },
        );
      }
      throw e;
    }

    return message(form, {
      message: m.documents_fileUpdated(),
      type: "success",
    });
  },
};

const isValidDocumentType = (type: string): type is DocumentType =>
  (validDocumentTypes as unknown as string[]).includes(type);
