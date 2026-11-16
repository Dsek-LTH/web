import type { DocumentGroupMap } from "$lib/files/documentGroups";
import type { FileData } from "$lib/files/fileHandler";
import { getNameOfFile } from "$lib/files/utils";

export type DocumentGroup = {
  name: string | null;
  files: FileData[];
};

export type DocumentMeeting = {
  name: string;
  files: FileData[];
  groups: DocumentGroup[];
};

export function splitDocumentPath(
  fileId: string,
  basePrefix: string,
): { meeting: string } | null {
  const prefix = basePrefix.endsWith("/") ? basePrefix : `${basePrefix}/`;
  if (!fileId.startsWith(prefix)) return null;

  const parts = fileId.slice(prefix.length).split("/").filter(Boolean);
  if (parts.length < 2) return null;

  return { meeting: parts[0]! };
}

export function getMeetingFileKey(
  fileId: string,
  meetingFolder: string,
): string {
  return fileId.slice(`${meetingFolder.replace(/\/$/, "")}/`.length);
}

export function groupDocuments(
  files: FileData[],
  basePrefix: string,
  options: {
    oldSrdFormat?: boolean;
    meetingFilter?: (meeting: string) => boolean;
    groupMaps?: Record<string, DocumentGroupMap>;
  } = {},
): DocumentMeeting[] {
  const meetings = new Map<
    string,
    { files: FileData[]; groups: Map<string | null, FileData[]> }
  >();
  const prefix = basePrefix.endsWith("/") ? basePrefix : `${basePrefix}/`;

  for (const file of files) {
    if (file.isDir) continue;

    let parsed = splitDocumentPath(file.id, prefix);
    if (
      parsed &&
      options.meetingFilter &&
      !options.meetingFilter(parsed.meeting)
    ) {
      parsed = null;
    }

    const meeting = parsed
      ? parsed.meeting
      : options.oldSrdFormat
        ? getNameOfFile(file.name)
        : null;
    if (!meeting) continue;

    const group = parsed
      ? (options.groupMaps?.[meeting]?.[
          getMeetingFileKey(file.id, `${prefix}${meeting}`)
        ] ?? null)
      : null;
    if (!meetings.has(meeting)) {
      meetings.set(meeting, { files: [], groups: new Map() });
    }

    const entry = meetings.get(meeting)!;
    entry.files.push(file);
    const groupFiles = entry.groups.get(group) ?? [];
    groupFiles.push(file);
    entry.groups.set(group, groupFiles);
  }

  return [...meetings.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "sv"))
    .map(([name, entry]) => ({
      name,
      files: entry.files,
      groups: [...entry.groups.entries()]
        .map(([groupName, groupFiles]) => ({
          name: groupName,
          files: groupFiles.sort((a, b) => a.name.localeCompare(b.name, "sv")),
        }))
        .sort((a, b) => {
          if (a.name === null) return 1;
          if (b.name === null) return -1;
          return a.name.localeCompare(b.name, "sv");
        }),
    }));
}

export function mergeMeetings(meetings: DocumentMeeting[]): DocumentMeeting[] {
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
    for (const group of meeting.groups) {
      group.files.sort((a, b) => a.name.localeCompare(b.name, "sv"));
    }
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

export const meetingDocumentPrefixes = {
  notice: ["kallelse", "notice"],
  agenda: [
    "föredragningslista",
    "foredragningslista",
    "fredragningslista",
    "dagordning",
    "agenda",
  ],
  minutes: [
    "motesprotokoll",
    "mötesprotokoll",
    "protokoll",
    "minutes",
    "minute",
    "protocol",
  ],
} as const;

export function findLatestFile(
  files: FileData[],
  prefixes: readonly string[],
): FileData | undefined {
  return files
    .filter((file) => {
      const name = file.name.toLowerCase();
      return prefixes.some((prefix) => name.includes(prefix.toLowerCase()));
    })
    .sort((a, b) => (a.modDate?.getTime() ?? 0) - (b.modDate?.getTime() ?? 0))
    .pop();
}

export function getMeetingFolder(
  fileId: string,
  bucket: string,
  documentsBucket: string,
  filesBucket: string,
): string | null {
  const parts = fileId.split("/");
  if (parts.at(-1) === "") return null;

  const folderParts = parts.slice(0, -1);
  if (bucket === documentsBucket) {
    if (folderParts[0] !== "public" || folderParts.length < 3) return null;
    return folderParts.slice(0, 3).join("/");
  }

  if (bucket === filesBucket) {
    if (
      folderParts[0] !== "public" ||
      folderParts[1] !== "srd" ||
      folderParts.length < 4
    ) {
      return null;
    }
    return folderParts.slice(0, 4).join("/");
  }

  return null;
}
