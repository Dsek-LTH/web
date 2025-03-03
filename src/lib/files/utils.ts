export const isFileImage = (file: File) => file.type.split("/")[0] === "image";
export const isFilePDF = (file: File) => file.type === "application/pdf";

export const getNameOfFile = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0) return fileName;
  return fileName.slice(0, dotIndex);
};

export const getExtensionOfFile = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0) return "";
  return fileName.slice(dotIndex + 1);
};
export const prepareNameForFilesystem = (
  name: string,
  fileName: string,
  extension: string | undefined = undefined,
) =>
  // replaces spaces with "_", substitutes umlaut characters, and removes all special characters
  `${name
    .replace(/\s/g, "_")
    .replace(/[åä]/g, "a")
    .replace(/[ÅÄ]/g, "A")
    .replace(/[ö]/g, "o")
    .replace(/[Ö]/g, "O")
    .replace(/[^a-zA-Z0-9_]/g, "")}.${
    extension ?? getExtensionOfFile(fileName)
  }`;
