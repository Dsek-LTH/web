import { PUBLIC_BUCKETS_ALBUMS } from "$env/static/public";
import minio from "$lib/files/minio";
import { ZipArchive } from "archiver";
import { error } from "@sveltejs/kit";
import { PassThrough, Readable } from "node:stream";
import type { RequestHandler } from "./$types";

const listObjects = async (bucket: string, prefix: string) => {
  const stream = minio.listObjectsV2(bucket, prefix, true);
  const objects: string[] = [];
  return new Promise<string[]>((resolve, reject) => {
    stream.on("data", (obj) => {
      if (obj.name && !obj.name.endsWith("_folder-preserver")) {
        objects.push(obj.name);
      }
    });
    stream.on("error", reject);
    stream.on("end", () => resolve(objects));
  });
};

export const GET: RequestHandler = async ({ params, locals }) => {
  const album = await locals.prisma.album.findFirst({
    where: { slug: params.slug },
    select: { id: true, slug: true },
  });

  if (!album) {
    error(404, "Album not found");
  }

  const bucket = PUBLIC_BUCKETS_ALBUMS;
  const albumPrefix = `public/${album.id}/album/`;
  const coverPrefix = `public/${album.id}/cover/`;

  const [albumObjects, coverObjects] = await Promise.all([
    listObjects(bucket, albumPrefix),
    listObjects(bucket, coverPrefix),
  ]);

  const body = new PassThrough();
  const archive = new ZipArchive({ zlib: { level: 6 } });
  archive.on("warning", (err) => console.warn("Zip warning:", err));
  archive.on("error", (err) => {
    console.error("Zip error:", err);
    body.destroy(err);
  });
  archive.pipe(body);

  // Stream the archive while it is being built, so the whole
  // zip does not have to be buffered in memory.
  void (async () => {
    try {
      for (const objectName of [...albumObjects, ...coverObjects]) {
        const entryName = objectName.startsWith(albumPrefix)
          ? `album/${objectName.slice(albumPrefix.length)}`
          : `cover/${objectName.slice(coverPrefix.length)}`;
        const content = await minio.getObject(bucket, objectName);
        archive.append(content, { name: entryName });
      }
      await archive.finalize();
    } catch (err) {
      console.error("Failed to build album zip", err);
      body.destroy(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return new Response(Readable.toWeb(body) as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${album.slug}.zip"`,
    },
  });
};
