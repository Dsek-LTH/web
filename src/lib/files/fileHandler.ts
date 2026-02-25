import { fileExists, isDir } from "$lib/files/helpers";
import { MINIO_BASE_URL } from "$lib/files/client";
import minio, { CopyConditions } from "$lib/files/minio";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { error } from "@sveltejs/kit";
import type { AuthUser } from "@zenstackhq/runtime";
import path from "path";

export type FileData = {
	id: string;
	name: string;
	modDate?: Date;
	size?: number;
	thumbnailUrl?: string;
	isDir?: boolean;
};

const isMinIOHealthy = async (): Promise<boolean> => {
	// https://min.io/docs/minio/linux/operations/monitoring/healthcheck-probe.html

	const url = `${MINIO_BASE_URL}minio/health/live`;
	return fetch(url, {
		method: "GET",
		cache: "reload", // Force cache reload to avoid stale data
	})
		.then((response) => {
			return response.ok && response.status === 200;
		})
		.catch((e) => {
			console.error(e);
			return false;
		});
};

const getFilesInFolder = async (
	bucket: string,
	prefix: string,
	recursive: boolean,
): Promise<FileData[]> => {
	const isHealthy: boolean = await isMinIOHealthy();
	if (!isHealthy) {
		return Promise.reject(new Error("MinIO is not healthy, cannot get files"));
	}
	return new Promise<FileData[]>((resolve, reject) => {
		const stream = minio.listObjectsV2(bucket, prefix, recursive);
		const files: FileData[] = [];
		stream.on("data", (obj) => {
			if (obj.name) {
				files.push({
					id: obj.name,
					name: path.basename(obj.name),
					modDate: obj.lastModified,
					size: obj.size,
					thumbnailUrl: `${MINIO_BASE_URL}${bucket}/${obj.name}`,
				});
			}
			if (obj.prefix) {
				files.push({
					id: obj.prefix,
					name: path.basename(obj.prefix),
					isDir: true,
				});
			}
		});
		stream.on("error", reject);
		stream.on("end", () => {
			resolve(files);
		});
	});
};

const getFilesInBucket = async (
	user: AuthUser | undefined,
	bucket: string,
	prefix: string,
	recursive = false,
): Promise<FileData[]> => {
	const isHealthy: boolean = await isMinIOHealthy();
	if (!isHealthy) {
		return Promise.reject(new Error("MinIO is not healthy, cannot get files"));
	}
	if (!bucket) {
		return Promise.resolve([]);
	}
	authorize(apiNames.FILES.BUCKET(bucket).READ, user);
	const basePath = "";
	const files = (
		await getFilesInFolder(
			bucket,
			prefix !== "/" ? basePath + prefix : basePath,
			recursive,
		)
	).filter((file) => file.name !== "_folder-preserver");
	return files;
};

const ONE_HOUR_IN_SECONDS = 60 * 60;
const getPresignedPutUrl = async (
	user: AuthUser | undefined,
	bucket: string,
	fileName: string,
	allowOverwrite = false,
): Promise<string> => {
	const isHealthy: boolean = await isMinIOHealthy();
	if (!isHealthy) {
		return Promise.reject(new Error("MinIO is not healthy, cannot get files"));
	}
	authorize(apiNames.FILES.BUCKET(bucket).CREATE, user);
	if (fileName === "") throw error(400, "File name cannot be empty");

	if (!allowOverwrite && (await fileExists(bucket, fileName))) {
		throw error(409, `File ${fileName} already exists`);
	}
	const url = await minio.presignedPutObject(
		bucket,
		fileName,
		ONE_HOUR_IN_SECONDS,
	);
	return url;
};

// Returns deleted files data
const removeFileGivenPath = async (
	user: AuthUser | undefined,
	bucket: string,
	filePath: string,
): Promise<FileData[]> => {
	const isHealthy: boolean = await isMinIOHealthy();
	if (!isHealthy) {
		return Promise.reject(new Error("MinIO is not healthy, cannot get files"));
	}
	const filesInFolder = await getFilesInFolder(bucket, filePath, true);
	if (filesInFolder.length > 1) {
		await minio.removeObjects(
			bucket,
			filesInFolder.map((file) => file.id),
		);
		return filesInFolder.map((file) => ({
			id: file.id,
			name: path.basename(file.id),
		}));
	} else if (filesInFolder.length === 1) {
		const file = filesInFolder[0]!;
		await minio.removeObject(bucket, file.id);
		return [
			{
				id: file.id,
				name: path.basename(file.id),
			},
		];
	} else {
		// file not found
		return [];
	}
};
/**
 * As the name implies this removes an object from the storage without checking any valid access, make sure to check access before calling this function
 */
export const removeFilesWithoutAccessCheck = async (
	user: AuthUser | undefined,
	bucket: string,
	fileNames: string[],
): Promise<FileData[]> => {
	const isHealthy: boolean = await isMinIOHealthy();
	if (!isHealthy) {
		return Promise.reject(new Error("MinIO is not healthy, cannot get files"));
	}
	const deleted: FileData[] = [];

	try {
		await Promise.all(
			fileNames.map(async (fileName) => {
				const deltedForFilePath = await removeFileGivenPath(
					user,
					bucket,
					fileName,
				);
				deleted.push(...deltedForFilePath);
			}),
		);
	} catch (e) {
		if (e instanceof Error)
			throw new Error(`Could not remove file, ${e.message}`);
		throw e;
	}
	return deleted;
};

const removeObjects = async (
	user: AuthUser | undefined,
	bucket: string,
	fileNames: string[],
) => {
	const isHealthy: boolean = await isMinIOHealthy();
	if (!isHealthy) {
		return Promise.reject(new Error("MinIO is not healthy, cannot get files"));
	}
	authorize(apiNames.FILES.BUCKET(bucket).DELETE, user);
	await removeFilesWithoutAccessCheck(user, bucket, fileNames);
};

type FileChange = {
	file: FileData;
	oldFile?: FileData;
};
const moveObject = async (
	user: AuthUser | undefined,
	bucket: string,
	fileNames: string[],
	newFolder: string,
) => {
	const isHealthy: boolean = await isMinIOHealthy();
	if (!isHealthy) {
		return Promise.reject(new Error("MinIO is not healthy, cannot get files"));
	}
	authorize(apiNames.FILES.BUCKET(bucket).UPDATE, user);
	const moved: FileChange[] = [];

	await Promise.all(
		fileNames.map(async (fileName) => {
			const basename = path.basename(fileName);

			if (isDir(fileName)) {
				const filesInFolder = await getFilesInBucket(user, bucket, fileName);
				if (filesInFolder) {
					const recursivedMoved = await moveObject(
						user,
						bucket,
						filesInFolder.map((file) => file.id),
						`${newFolder + basename}/`,
					);
					const FileChange = {
						file: {
							id: `${newFolder + basename}/`,
							name: basename,
							isDir: true,
						},
						oldFile: { id: fileName, name: basename, isDir: true },
					};
					moved.push(FileChange);
					moved.push(...recursivedMoved);
				}
			} else {
				const newFileName = path.join(newFolder, basename);

				const objectStats = await minio.statObject(bucket, fileName);

				if (await fileExists(bucket, newFileName)) {
					return;
				}

				const oldFile = {
					id: fileName,
					name: path.basename(fileName),
					modDate: objectStats.lastModified,
					size: objectStats.size,
					thumbnailUrl: `${MINIO_BASE_URL}${bucket}/${fileName}`,
				};

				const newFile = {
					id: newFileName,
					name: path.basename(newFileName),
					size: objectStats.size,
					thumbnailUrl: `${MINIO_BASE_URL}${bucket}/${newFileName}`,
				};

				await minio.copyObject(
					bucket,
					newFileName,
					`/${bucket}/${fileName}`,
					new CopyConditions(),
				);
				await minio.removeObject(bucket, fileName);

				const FileChange = {
					file: newFile,
					oldFile,
				};

				moved.push(FileChange);
			}
		}),
	);
	return moved;
};

const renameObject = async (
	user: AuthUser | undefined,
	bucket: string,
	fileName: string,
	newFileName: string,
) => {
	const isHealthy: boolean = await isMinIOHealthy();
	if (!isHealthy) {
		return Promise.reject(new Error("MinIO is not healthy, cannot get files"));
	}
	authorize(apiNames.FILES.BUCKET(bucket).UPDATE, user);
	if (await fileExists(bucket, newFileName)) {
		throw error(409, `File ${newFileName} already exists`);
	}
	const dirname = path.dirname(fileName);

	if (isDir(fileName)) {
		const filesInFolder = await getFilesInBucket(user, bucket, fileName);
		if (filesInFolder) {
			await moveObject(
				user,
				bucket,
				filesInFolder.map((file) => file.id),
				`${newFileName}/`,
			);
		}
		return undefined;
	}
	const newFileId = path.join(`${dirname}/`, newFileName);

	const objectStats = await minio.statObject(bucket, fileName);

	if (await fileExists(bucket, newFileId)) {
		return undefined;
	}

	const oldFile = {
		id: fileName,
		name: path.basename(fileName),
		modDate: objectStats.lastModified,
		size: objectStats.size,
		thumbnailUrl: `${MINIO_BASE_URL}${bucket}/${fileName}`,
	};

	const newFile = {
		id: newFileId,
		name: path.basename(newFileId),
		size: objectStats.size,
		thumbnailUrl: `${MINIO_BASE_URL}${bucket}/${newFileId}`,
	};

	await minio.copyObject(
		bucket,
		newFileName,
		`/${bucket}/${fileName}`,
		new CopyConditions(),
	);
	await minio.removeObject(bucket, fileName);

	const FileChange = {
		file: newFile,
		oldFile,
	};

	return FileChange;
};
const fileHandler = {
	isMinIOHealthy: isMinIOHealthy,
	getInBucket: getFilesInBucket,
	getPresignedPutUrl,
	remove: removeObjects,
	move: moveObject,
	rename: renameObject,
};
export default fileHandler;
