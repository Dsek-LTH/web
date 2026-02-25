import { PUBLIC_BUCKETS_ALBUMS } from "$env/static/public";
import { fileHandler } from "$lib/files";
import type { FileData } from "$lib/files/fileHandler";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;

	const files: FileData[] = await fileHandler
		.getInBucket(user, PUBLIC_BUCKETS_ALBUMS, "public/", true)
		.catch((err) => {
			console.error("Error fetching files", err);
			return [];
		});

	const filesGroupedByAlbum = files.reduce<Record<string, FileData[]>>(
		(acc, file) => {
			const fileParts = file.id.split("/");
			const album = fileParts[fileParts.length - 2] ?? "unknown";
			if (!acc[album]) acc[album] = [];
			acc[album]!.push(file);
			return acc;
		},
		{},
	);

	const albumEntries = Object.entries(filesGroupedByAlbum);
	return {
		albums: albumEntries,
	};
};
