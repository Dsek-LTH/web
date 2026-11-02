<script lang="ts">
  import { page } from "$app/state";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import type { LikeSchema } from "./likes";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import * as m from "$paraglide/messages";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { Button } from "$lib/components/ui/button";
  import { ThumbsUp } from "@lucide/svelte";

  let {
    likers,
    articleId,
    likeForm,
  }: {
    likers: Array<ExtendedPrismaModel<"Member">>;
    articleId: string;
    likeForm: SuperValidated<LikeSchema>;
  } = $props();

  let authorized = $derived(isAuthorized(apiNames.NEWS.LIKE, page.data.user));

  // svelte-ignore state_referenced_locally
  const { errors, constraints, enhance } = superForm(likeForm, {
    id: articleId, // needs to be unique since there could be multiple like buttons on a page
    invalidateAll: true,
  });
  let isLiked = $derived(
    likers.some((member) => member.studentId === page.data.user?.studentId),
  );
</script>

<form method="POST" action="?/{isLiked ? 'dislike' : 'like'}" use:enhance>
  <input type="hidden" value={articleId} name="articleId" {...$constraints} />
  {#if $errors.articleId}
    <div class="text-error">{$errors.articleId}</div>
  {/if}

  <Button
    variant={isLiked ? "rosa" : "outline"}
    disabled={!authorized}
    type="submit"
  >
    <ThumbsUp />
    {isLiked ? m.news_likes() : m.news_like()}
  </Button>
</form>
