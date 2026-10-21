import { describe, expect, it } from "vitest";
import {
  buildArticlePreview,
  getPreviewBody,
  getPreviewHeader,
} from "./preview";

const createdAt = new Date("2026-01-02T10:00:00Z");
const publishedAt = new Date("2026-02-03T10:00:00Z");
const now = new Date("2026-03-04T10:00:00Z");

const tags = [
  { id: "tag-1", nameSv: "Nollning", nameEn: "Orientation", color: "#fff" },
  { id: "tag-2", nameSv: "Sektionen", nameEn: null, color: null },
];

const committees = [
  {
    id: "committee-1",
    nameSv: "Studierådet",
    nameEn: "The Study Council",
    shortName: "studier",
    symbolUrl: "/studier.svg",
  },
];

const baseForm = {
  headerSv: "Svensk rubrik",
  headerEn: "English header",
  bodySv: "# Svensk text",
  bodyEn: "# English text",
  tags: [{ id: "tag-1" }, { id: "tag-2" }],
  imageUrls: [] as string[],
  imageUrl: null as string | null,
  committeeId: "committee-1" as string | null,
  publishTime: null as Date | null,
  youtubeUrl: null as string | null,
};

describe("getPreviewHeader", () => {
  it("returns the Swedish header in Swedish mode", () => {
    expect(getPreviewHeader(baseForm, "sv")).toBe("Svensk rubrik");
  });

  it("returns the English header in English mode", () => {
    expect(getPreviewHeader(baseForm, "en")).toBe("English header");
  });

  it("falls back to Swedish when the English header is empty", () => {
    expect(getPreviewHeader({ ...baseForm, headerEn: "" }, "en")).toBe(
      "Svensk rubrik",
    );
  });
});

describe("getPreviewBody", () => {
  it("returns the markdown body for the active language", () => {
    expect(getPreviewBody(baseForm, "sv")).toBe("# Svensk text");
    expect(getPreviewBody(baseForm, "en")).toBe("# English text");
  });

  it("falls back to the Swedish body when the English body is empty", () => {
    expect(getPreviewBody({ ...baseForm, bodyEn: null }, "en")).toBe(
      "# Svensk text",
    );
    expect(getPreviewBody({ ...baseForm, bodyEn: "" }, "en")).toBe(
      "# Svensk text",
    );
  });

  it("returns an empty string when there is no body", () => {
    expect(getPreviewBody({ ...baseForm, bodySv: null }, "sv")).toBe("");
  });
});

describe("buildArticlePreview", () => {
  it("builds the article content in the active language", () => {
    const preview = buildArticlePreview({
      form: baseForm,
      tags,
      committees,
      language: "en",
      createdAt,
      now,
    });

    expect(preview.article).toEqual({
      header: "English header",
      body: "# English text",
      createdAt,
      imageUrls: [],
      tags: [
        { id: "tag-1", name: "Orientation", color: "#fff" },
        { id: "tag-2", name: "Sektionen", color: null },
      ],
      youtubeUrl: null,
    });
    expect(preview.committee?.name).toBe("The Study Council");
  });

  it("passes the YouTube URL through to the article preview", () => {
    const preview = buildArticlePreview({
      form: {
        ...baseForm,
        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      tags,
      committees,
      language: "sv",
      createdAt,
      now,
    });

    expect(preview.article.youtubeUrl).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
  });

  it("preserves selected tag order and removes duplicates", () => {
    const preview = buildArticlePreview({
      form: {
        ...baseForm,
        tags: [{ id: "tag-2" }, { id: "tag-1" }, { id: "tag-2" }],
      },
      tags,
      committees,
      language: "sv",
      createdAt,
      now,
    });

    expect(preview.article.tags.map((tag) => tag.id)).toEqual([
      "tag-2",
      "tag-1",
    ]);
  });

  it("drops selected tags that no longer exist", () => {
    const preview = buildArticlePreview({
      form: { ...baseForm, tags: [{ id: "deleted-tag" }] },
      tags,
      committees,
      language: "sv",
      createdAt,
      now,
    });

    expect(preview.article.tags).toEqual([]);
  });

  it("returns a null committee when none is selected or it is missing", () => {
    const withoutSelection = buildArticlePreview({
      form: { ...baseForm, committeeId: null },
      tags,
      committees,
      language: "sv",
      createdAt,
      now,
    });
    const withMissingCommittee = buildArticlePreview({
      form: { ...baseForm, committeeId: "missing" },
      tags,
      committees,
      language: "sv",
      createdAt,
      now,
    });

    expect(withoutSelection.committee).toBeNull();
    expect(withMissingCommittee.committee).toBeNull();
  });

  it("previews uploaded images and uses the first as cover when creating", () => {
    const preview = buildArticlePreview({
      form: baseForm,
      tags,
      committees,
      language: "sv",
      createdAt,
      now,
      uploadedImageUrls: ["blob:new-1", "blob:new-2"],
    });

    expect(preview.article.imageUrls).toEqual(["blob:new-1", "blob:new-2"]);
    expect(preview.cardImageUrl).toBe("blob:new-1");
  });

  it("appends uploads and keeps the existing cover when editing", () => {
    const preview = buildArticlePreview({
      form: {
        ...baseForm,
        imageUrls: ["/existing-1.jpg"],
        imageUrl: "/cover.jpg",
      },
      tags,
      committees,
      language: "sv",
      createdAt,
      now,
      uploadedImageUrls: ["blob:new-1"],
      isEditing: true,
    });

    expect(preview.article.imageUrls).toEqual([
      "/existing-1.jpg",
      "blob:new-1",
    ]);
    expect(preview.cardImageUrl).toBe("/cover.jpg");
  });

  it("uses the scheduled publish date for the card when set", () => {
    const preview = buildArticlePreview({
      form: { ...baseForm, publishTime: publishedAt },
      tags,
      committees,
      language: "sv",
      createdAt,
      now,
    });

    expect(preview.cardPublishedAt).toBe(publishedAt);
  });

  it("falls back to now when publishing immediately", () => {
    expect(
      buildArticlePreview({
        form: baseForm,
        tags,
        committees,
        language: "sv",
        createdAt,
        now,
      }).cardPublishedAt,
    ).toBe(now);
  });
});
