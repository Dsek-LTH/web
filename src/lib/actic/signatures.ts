import type { TypstFile } from "./typst";

/**
 * Uploaded signature images live only in memory for the session — they are
 * deliberately not persisted (see the GDPR note in the plan). Bytes are kept
 * out of Svelte state (they are not reactive) and referenced by a virtual path
 * that is mapped into the Typst compiler as a shadow file.
 */
type Signature = { bytes: Uint8Array; preview: string };

const store = new Map<string, Signature>();
let counter = 0;

const ALLOWED = ["image/png", "image/jpeg", "image/svg+xml"];
const MAX_BYTES = 1_000_000;

export function isAllowedSignature(file: File): boolean {
  return ALLOWED.includes(file.type) && file.size <= MAX_BYTES;
}

export async function addSignature(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext =
    { "image/png": "png", "image/jpeg": "jpg", "image/svg+xml": "svg" }[
      file.type
    ] ?? "png";
  const path = `/signatures/sig-${counter++}.${ext}`;
  store.set(path, { bytes, preview: URL.createObjectURL(file) });
  return path;
}

export function getSignaturePreview(path: string): string | undefined {
  return store.get(path)?.preview;
}

export function removeSignature(path: string): void {
  const entry = store.get(path);
  if (entry) {
    URL.revokeObjectURL(entry.preview);
    store.delete(path);
  }
}

/** Collect the shadow files for every author that has a signature. */
export function signatureFiles(paths: Array<string | undefined>): TypstFile[] {
  return paths
    .filter((p): p is string => !!p)
    .map((path) => ({ path, bytes: store.get(path)?.bytes }))
    .filter((f): f is TypstFile => !!f.bytes);
}
