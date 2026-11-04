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
): { meeting: string; group: string | null } | null {
  const prefix = basePrefix.endsWith("/") ? basePrefix : `${basePrefix}/`;
  if (!fileId.startsWith(prefix)) return null;

  const parts = fileId.slice(prefix.length).split("/").filter(Boolean);
  if (parts.length < 2) return null;

  return {
    meeting: parts[0]!,
    group: parts.length > 2 ? parts.slice(1, -1).join("/") : null,
  };
}

export function groupDocuments(
  files: FileData[],
  basePrefix: string,
  options: {
    oldSrdFormat?: boolean;
    meetingFilter?: (meeting: string) => boolean;
  } = {},
): DocumentMeeting[] {
  const meetings = new Map<
    string,
    { files: FileData[]; groups: Map<string | null, FileData[]> }
  >();

  for (const file of files) {
    if (file.isDir) continue;

    let parsed = splitDocumentPath(file.id, basePrefix);
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

    const group = parsed?.group ?? null;
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
          files: groupFiles,
        }))
        .sort((a, b) => {
          if (a.name === null) return 1;
          if (b.name === null) return -1;
          return a.name.localeCompare(b.name, "sv");
        }),
    }));
}

export function findLatestFile(
  files: FileData[],
  prefixes: string[],
): FileData | undefined {
  return files
    .filter((file) =>
      prefixes.some((prefix) =>
        file.name.toLowerCase().startsWith(prefix.toLowerCase()),
      ),
    )
    .sort((a, b) => (a.modDate?.getTime() ?? 0) - (b.modDate?.getTime() ?? 0))
    .pop();
}
