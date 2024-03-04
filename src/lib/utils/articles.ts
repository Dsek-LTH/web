// function so "new Date()" is not called at import time
export const BASIC_ARTICLE_FILTER = () => ({
  publishedAt: {
    lte: new Date(),
    not: null,
  },
  OR: [{ removedAt: { gt: new Date() } }, { removedAt: null }],
});
