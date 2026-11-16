import type { AuthUser } from "@zenstackhq/runtime";
import { buffer } from "node:stream/consumers";
import minio from "$lib/files/minio";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";

export const DOCUMENT_GROUPS_FILE = "_groups.json";

export const isReservedGroupName = (name: string) =>
  name === DOCUMENT_GROUPS_FILE;

export type DocumentGroupMap = Record<string, string>;

const groupMapKey = (folder: string) =>
  `${folder.replace(/\/$/, "")}/${DOCUMENT_GROUPS_FILE}`;

const isNotFound = (error: unknown) =>
  ["NoSuchKey", "NotFound", "NoSuchBucket"].includes(
    (error as { code?: string })?.code ?? "",
  );

// Throws on real storage errors so updates cannot overwrite a sidecar that
// could not be read.
async function loadGroupMap(
  bucket: string,
  folder: string,
): Promise<DocumentGroupMap> {
  try {
    const body = (
      await buffer(await minio.getObject(bucket, groupMapKey(folder)))
    ).toString("utf8");
    const { files } = JSON.parse(body) as { files?: unknown };
    return Object.fromEntries(
      Object.entries(files ?? {}).flatMap(([name, group]) =>
        typeof group === "string" && group.trim() ? [[name, group.trim()]] : [],
      ),
    );
  } catch (error) {
    if (isNotFound(error)) return {};
    throw error;
  }
}

export async function readGroupMap(
  user: AuthUser | undefined,
  bucket: string,
  folder: string,
): Promise<DocumentGroupMap> {
  authorize(apiNames.FILES.BUCKET(bucket).READ, user);
  return loadGroupMap(bucket, folder).catch((error) => {
    console.error(
      `Error reading document groups at ${bucket}/${folder}`,
      error,
    );
    return {};
  });
}

// In-process queue per sidecar. The web deployment currently runs one replica;
// use conditional writes if that changes.
const updates = new Map<string, Promise<void>>();

export async function updateGroupMap(
  user: AuthUser | undefined,
  bucket: string,
  folder: string,
  mutate: (map: DocumentGroupMap) => boolean,
  permission: string = apiNames.FILES.BUCKET(bucket).UPDATE,
): Promise<void> {
  authorize(permission, user);

  const id = `${bucket}/${folder}`;
  const run = (updates.get(id) ?? Promise.resolve())
    .catch(() => undefined)
    .then(async () => {
      const map = await loadGroupMap(bucket, folder);
      if (!mutate(map)) return;

      const body = Buffer.from(
        JSON.stringify({ version: 1, files: map }, null, 2),
      );
      await minio.putObject(bucket, groupMapKey(folder), body, body.length, {
        "Content-Type": "application/json",
      });
    });

  updates.set(id, run);
  try {
    await run;
  } finally {
    if (updates.get(id) === run) updates.delete(id);
  }
}
