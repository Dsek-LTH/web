import { beforeEach, describe, expect, it, vi } from "vitest";

const { getObject, putObject } = vi.hoisted(() => ({
  getObject: vi.fn(),
  putObject: vi.fn(),
}));

vi.mock("$lib/files/minio", () => ({ default: { getObject, putObject } }));
vi.mock("$lib/utils/authorization", () => ({ authorize: vi.fn() }));

import { readGroupMap, updateGroupMap } from "./documentGroups";

const folder = "public/2026/HTM1";
const sidecar = (files: Record<string, string>) =>
  (async function* () {
    yield Buffer.from(JSON.stringify({ version: 1, files }));
  })();
const read = () => readGroupMap(undefined, "documents", folder);
const update = (mutate: (map: Record<string, string>) => boolean) =>
  updateGroupMap(undefined, "documents", folder, mutate);

describe("document groups", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns an empty map when the sidecar is missing", async () => {
    getObject.mockRejectedValue({ code: "NoSuchKey" });
    await expect(read()).resolves.toEqual({});
  });

  it("parses keys and trims group names", async () => {
    getObject.mockResolvedValue(
      sidecar({ "a.pdf": " Motion 1 ", "b.pdf": " " }),
    );
    await expect(read()).resolves.toEqual({ "a.pdf": "Motion 1" });
  });

  it("preserves existing groups when adding one", async () => {
    getObject.mockResolvedValue(sidecar({ "a.pdf": "Motion 1" }));
    await update((map) => {
      map["b.pdf"] = "Motion 2";
      return true;
    });
    const body = JSON.parse(putObject.mock.calls[0]![2].toString());
    expect(body.files).toEqual({ "a.pdf": "Motion 1", "b.pdf": "Motion 2" });
  });

  it("does not write when the mutation changed nothing", async () => {
    getObject.mockResolvedValue(sidecar({}));
    await update(() => false);
    expect(putObject).not.toHaveBeenCalled();
  });

  it("does not overwrite a sidecar it could not read", async () => {
    getObject.mockRejectedValue(new Error("storage unavailable"));
    await expect(update(() => true)).rejects.toThrow("storage unavailable");
    expect(putObject).not.toHaveBeenCalled();
  });

  it("serializes concurrent updates to the same sidecar", async () => {
    let files: Record<string, string> = {};
    getObject.mockImplementation(async () => sidecar(files));
    putObject.mockImplementation(async (_bucket, _key, body) => {
      files = JSON.parse(body.toString()).files;
    });

    await Promise.all([
      update((map) => {
        map["a.pdf"] = "A";
        return true;
      }),
      update((map) => {
        map["b.pdf"] = "B";
        return true;
      }),
    ]);

    expect(files).toEqual({ "a.pdf": "A", "b.pdf": "B" });
  });
});
