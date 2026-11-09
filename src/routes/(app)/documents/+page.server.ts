import {
  PUBLIC_BUCKETS_DOCUMENTS,
  PUBLIC_BUCKETS_FILES,
} from "$env/static/public";
import type { AuthUser } from "@zenstackhq/runtime";
import { fileHandler } from "$lib/files";
import type { FileData } from "$lib/files/fileHandler";
import {
  isReservedGroupName,
  readGroupMap,
  updateGroupMap,
  type DocumentGroupMap,
} from "$lib/files/documentGroups";
import apiNames from "$lib/utils/apiNames";
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
  getMeetingFileKey,
  getMeetingFolder,
  groupDocuments,
  mergeMeetings,
  splitDocumentPath,
  type DocumentMeeting,
} from "./grouping";
import { DocumentTypes as dt } from "./types";
import { deleteFileSchema } from "./schemas";
import { groupNameSchema, isSafePathSegment } from "./groupName";

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

  let loadError = false;
  const documentsFiles: FileData[] = await fileHandler
    .getInBucket(
      user,
      PUBLIC_BUCKETS_DOCUMENTS,
      "public/" + year + "/" + (prefixByType[type] ?? ""),
      true,
    )
    .catch((err) => {
      console.error("Error fetching files", err);
      loadError = true;
      return [];
    });

  const documentsGroupMaps = await readGroupMaps(
    user,
    PUBLIC_BUCKETS_DOCUMENTS,
    documentsFiles,
    `public/${year}/`,
  );
  const documentMeetings = groupDocuments(documentsFiles, `public/${year}/`, {
    groupMaps: documentsGroupMaps,
  });

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
          loadError = true;
          return [];
        });
      const srdGroupMaps = await readGroupMaps(
        user,
        PUBLIC_BUCKETS_FILES,
        srdFiles,
        `public/srd/${year}/`,
      );
      const srdMeetings = groupDocuments(srdFiles, `public/srd/${year}/`, {
        oldSrdFormat: true,
        meetingFilter: (name) =>
          name.startsWith("SRD") || name.startsWith("Möte"),
        groupMaps: srdGroupMaps,
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
    loadError,
    deleteForm: await superValidate(zod4(deleteSchema)),
    editForm: await superValidate(zod4(editFileSchema)),
  };
};

async function readGroupMaps(
  user: AuthUser | undefined,
  bucket: string,
  files: FileData[],
  prefix: string,
): Promise<Record<string, DocumentGroupMap>> {
  const meetings = new Set(
    files.flatMap(({ id, isDir }) => {
      const parsed = isDir ? null : splitDocumentPath(id, prefix);
      return parsed ? [parsed.meeting] : [];
    }),
  );

  return Object.fromEntries(
    await Promise.all(
      [...meetings].map(
        async (meeting) =>
          [
            meeting,
            await readGroupMap(user, bucket, `${prefix}${meeting}`),
          ] as const,
      ),
    ),
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
      (value) => !isReservedGroupName(value) && isSafePathSegment(value),
      { message: m.documents_errors_invalidFileName() },
    ),
  group: groupNameSchema.default(""),
});
export type EditSchema = Infer<typeof editFileSchema>;

const isDocumentGroupsFile = (id: string) =>
  isReservedGroupName(id.split("/").at(-1) ?? "");

export const actions: Actions = {
  deleteFile: async ({ request, locals }) => {
    const { user } = locals;
    const form = await superValidate(request, zod4(deleteSchema));
    if (!form.valid) return fail(400, { form });
    const { id, bucket } = form.data;
    if (isDocumentGroupsFile(id)) {
      return message(
        form,
        { message: m.documents_errors_invalidFileName(), type: "error" },
        { status: 400 },
      );
    }

    const meetingFolder = getMeetingFolder(
      id,
      bucket,
      PUBLIC_BUCKETS_DOCUMENTS,
      PUBLIC_BUCKETS_FILES,
    );
    // Delete the object first so a failed delete never strips a surviving
    // file's group. If the sidecar update then fails, the stale key only
    // matters if a new file reuses the same path.
    await fileHandler.remove(user, bucket, [id]);

    if (meetingFolder) {
      const fileKey = getMeetingFileKey(id, meetingFolder);
      await updateGroupMap(
        user,
        bucket,
        meetingFolder,
        (map) => (fileKey in map ? delete map[fileKey] : false),
        apiNames.FILES.BUCKET(bucket).DELETE,
      );
    }

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
    if (isDocumentGroupsFile(id)) {
      return message(
        form,
        { message: m.documents_errors_invalidFileName(), type: "error" },
        { status: 400 },
      );
    }

    const isOldSrdFile =
      bucket === PUBLIC_BUCKETS_FILES &&
      id.startsWith("public/srd/") &&
      id.split("/").length === 4;
    const meetingFolder = isOldSrdFile
      ? null
      : getMeetingFolder(
          id,
          bucket,
          PUBLIC_BUCKETS_DOCUMENTS,
          PUBLIC_BUCKETS_FILES,
        );
    if (!meetingFolder && !isOldSrdFile) {
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

    const fileName = id.split("/").at(-1)!;
    const fileKey = meetingFolder ? getMeetingFileKey(id, meetingFolder) : null;
    if (name !== fileName) {
      // Rename first so a failed sidecar write can be reported without
      // claiming the rename failed; a stale key leaves the file ungrouped
      // until it is edited again.
      try {
        await fileHandler.rename(user, bucket, id, name);
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
    }

    if (meetingFolder && fileKey) {
      const nextKey = fileKey.replace(/[^/]+$/, () => name);
      try {
        await updateGroupMap(user, bucket, meetingFolder, (map) => {
          if (!(fileKey in map) && !group) return false;
          if (name === fileName && (map[fileKey] ?? "") === group) return false;
          delete map[fileKey];
          if (group) map[nextKey] = group;
          return true;
        });
      } catch (error) {
        console.error("Could not update document group", error);
        return message(form, {
          message: m.documents_errors_groupNotUpdated(),
          type: "warning",
        });
      }
    }

    return message(form, {
      message: m.documents_fileUpdated(),
      type: "success",
    });
  },
};

const isValidDocumentType = (type: string): type is DocumentType =>
  (validDocumentTypes as unknown as string[]).includes(type);
