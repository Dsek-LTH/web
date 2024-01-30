import minio from "$lib/files/minio";

export const fileExists = async (
  bucket: string,
  fileName: string,
): Promise<boolean> => {
  try {
    await minio.statObject(bucket, fileName);
    return true;
  } catch (error) {
    return false;
  }
};

export const isDir = (fileName: string): boolean => {
  return fileName.charAt(fileName.length - 1) === "/";
};
