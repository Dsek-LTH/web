import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

// The like form only carries which article it's for - the like itself is
// a Go call ($lib/server/... in [slug]/+page.server.ts's like/dislike).
export const likeSchema = z.object({
  articleId: z.string(),
});
export type LikeSchema = Infer<typeof likeSchema>;
