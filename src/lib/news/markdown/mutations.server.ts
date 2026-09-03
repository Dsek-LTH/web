import { type ExtendedPrisma } from "$lib/server/extendedPrisma";
import DOMPurify from "isomorphic-dompurify";

export const updateMarkdown = async (
  prisma: ExtendedPrisma,
  markdown: {
    name: string;
    markdownSv: string;
    markdownEn: string | null | undefined;
  },
) => {
  // Per-page edit access is granted via auth().editableMarkdowns,
  // see schema.zmodel's Markdown model and getEditableMarkdowns().
  return await prisma.markdown.update({
    where: {
      name: markdown.name,
    },
    data: {
      markdownSv: DOMPurify.sanitize(markdown.markdownSv),
      markdownEn: markdown.markdownEn
        ? DOMPurify.sanitize(markdown.markdownEn)
        : markdown.markdownEn,
    },
  });
};
