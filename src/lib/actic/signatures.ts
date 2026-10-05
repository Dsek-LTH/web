import type { TypstFile } from "./typst";

/**
 * Uploaded signature images are kept in memory for the session and referenced by
 * a virtual path that is mapped into the Typst compiler as a shadow file. Bytes
 * are deliberately kept out of Svelte state (they are not reactive). Drafts
 * persist the image as a data URL (see `drafts.ts`), which `restoreSignature`
 * reads back when a draft is opened.
 */
type Signature = { bytes: Uint8Array; preview: string; dataUrl: string };

const store = new Map<string, Signature>();

const ALLOWED = ["image/png", "image/jpeg", "image/svg+xml"];
const MAX_BYTES = 1_000_000;

export function isAllowedSignature(file: File): boolean {
  return ALLOWED.includes(file.type) && file.size <= MAX_BYTES;
}

function readDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function addSignature(file: File): Promise<string> {
  const [buffer, dataUrl] = await Promise.all([
    file.arrayBuffer(),
    readDataUrl(file),
  ]);
  const ext =
    { "image/png": "png", "image/jpeg": "jpg", "image/svg+xml": "svg" }[
      file.type
    ] ?? "png";
  const path = `/signatures/sig-${crypto.randomUUID()}.${ext}`;
  store.set(path, {
    bytes: new Uint8Array(buffer),
    preview: URL.createObjectURL(file),
    dataUrl,
  });
  return path;
}

/** Re-create a signature from a persisted data URL (when opening a draft). */
export async function restoreSignature(
  path: string,
  dataUrl: string,
): Promise<void> {
  if (store.has(path)) return;
  const bytes = new Uint8Array(await (await fetch(dataUrl)).arrayBuffer());
  store.set(path, { bytes, preview: dataUrl, dataUrl });
}

/** The data URL for a stored signature, for persisting in a draft. */
export function signatureDataUrl(path: string): string | undefined {
  return store.get(path)?.dataUrl;
}

export function getSignaturePreview(path: string): string | undefined {
  return store.get(path)?.preview;
}

export function removeSignature(path: string): void {
  const entry = store.get(path);
  if (entry) {
    if (entry.preview.startsWith("blob:")) URL.revokeObjectURL(entry.preview);
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
