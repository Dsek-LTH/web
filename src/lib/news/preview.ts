import { sanitizeHtml } from "$lib/utils/sanitize";
import type { ArticleCommitteeSummary, ArticleContentData } from "./types";

export type PreviewLanguage = "sv" | "en";

export type PreviewTagSource = {
  id: string;
  nameSv: string;
  nameEn?: string | null;
  color?: string | null;
};

export type PreviewCommitteeSource = {
  id: string;
  nameSv: string;
  nameEn?: string | null;
  shortName?: string | null;
  symbolUrl?: string | null;
};

export type PreviewForm = {
  headerSv: string;
  headerEn?: string | null;
  bodySv?: string | null;
  bodyEn?: string | null;
  tags: Array<{ id: string }>;
  imageUrls?: string[] | null;
  imageUrl?: string | null;
  committeeId?: string | null;
  publishTime?: Date | null;
  youtubeUrl?: string | null;
};

export type ArticlePreview = {
  article: ArticleContentData;
  committee: ArticleCommitteeSummary | null;
  cardImageUrl: string | null;
  cardPublishedAt: Date;
};

const localized = (
  language: PreviewLanguage,
  swedish: string,
  english?: string | null,
) => (language === "en" && english ? english : swedish);

/**
 * Returns the header that should be shown in the editor preview. English falls
 * back to Swedish when no English translation has been written yet.
 */
export const getPreviewHeader = (
  article: Pick<PreviewForm, "headerSv" | "headerEn">,
  language: PreviewLanguage,
) => localized(language, article.headerSv, article.headerEn);

/**
 * Returns the markdown body that should be shown in the editor preview. English
 * falls back to Swedish when no English translation has been written yet.
 */
export const getPreviewBody = (
  article: Pick<PreviewForm, "bodySv" | "bodyEn">,
  language: PreviewLanguage,
): string => localized(language, article.bodySv ?? "", article.bodyEn);

/**
 * Builds everything the editor preview needs from the current form state. The
 * image ordering and cover rules intentionally mirror what the server action
 * persists for create and update, so the preview does not promise a different
 * article than the one that will be saved.
 */
export const buildArticlePreview = ({
  form,
  tags,
  committees,
  language,
  createdAt,
  now,
  uploadedImageUrls = [],
  isEditing = false,
}: {
  form: PreviewForm;
  tags: PreviewTagSource[];
  committees: PreviewCommitteeSource[];
  language: PreviewLanguage;
  createdAt: Date;
  now: Date;
  uploadedImageUrls?: string[];
  isEditing?: boolean;
}): ArticlePreview => {
  const seenTags = new Set<string>();
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
  const previewTags = form.tags.flatMap(({ id }) => {
    if (seenTags.has(id)) return [];
    seenTags.add(id);

    const tag = tagsById.get(id);
    return tag
      ? [
          {
            id: tag.id,
            name: localized(language, tag.nameSv, tag.nameEn),
            color: tag.color ?? null,
          },
        ]
      : [];
  });

  const committeeSource = committees.find(
    (committee) => committee.id === form.committeeId,
  );
  const committee = committeeSource
    ? {
        id: committeeSource.id,
        name: localized(
          language,
          committeeSource.nameSv,
          committeeSource.nameEn,
        ),
        shortName: committeeSource.shortName ?? null,
        symbolUrl: committeeSource.symbolUrl ?? null,
      }
    : null;

  const existingImageUrls = form.imageUrls ?? [];
  const imageUrls = isEditing
    ? [...existingImageUrls, ...uploadedImageUrls]
    : [...uploadedImageUrls];
  const cardImageUrl = isEditing
    ? (form.imageUrl ?? null)
    : (uploadedImageUrls[0] ?? form.imageUrl ?? null);

  return {
    article: {
      header: getPreviewHeader(form, language),
      // Match the server write path, which sanitizes the markdown source.
      body: sanitizeHtml(getPreviewBody(form, language)),
      createdAt,
      imageUrls,
      tags: previewTags,
      youtubeUrl: form.youtubeUrl ?? null,
    },
    committee,
    cardImageUrl,
    cardPublishedAt: form.publishTime ?? now,
  };
};
