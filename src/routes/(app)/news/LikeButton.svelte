<script lang="ts">
  import { page } from "$app/state";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import type { LikeSchema } from "./likes";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import { signIn } from "$lib/utils/auth";
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

  let loggedIn = $derived(!!page.data.user?.studentId);
  let authorized = $derived(isAuthorized(apiNames.NEWS.LIKE, page.data.user));

  let serverLiked = $derived(
    likers.some((member) => member.studentId === page.data.user?.studentId),
  );
  // Set while a request is in flight so the button reacts instantly; cleared once the
  // reloaded likers arrive, or reverted if the request fails.
  let optimisticLiked = $state<boolean | null>(null);
  let isLiked = $derived(optimisticLiked ?? serverLiked);
  let count = $derived(
    likers.length + (isLiked === serverLiked ? 0 : isLiked ? 1 : -1),
  );

  // svelte-ignore state_referenced_locally
  const { errors, constraints, enhance } = superForm(likeForm, {
    id: articleId, // needs to be unique since there could be multiple like buttons on a page
    invalidateAll: true,
    onSubmit: () => {
      optimisticLiked = !isLiked;
    },
    onUpdated: () => {
      optimisticLiked = null;
    },
    // Not onError: that would replace the wrapper's error toast.
    onResult: ({ result }) => {
      if (result.type === "failure" || result.type === "error") {
        optimisticLiked = null;
      }
    },
  });
</script>

{#if loggedIn}
  <form method="POST" action="?/{isLiked ? 'dislike' : 'like'}" use:enhance>
    <input type="hidden" value={articleId} name="articleId" {...$constraints} />
    {#if $errors.articleId}
      <div class="text-destructive text-sm">{$errors.articleId}</div>
    {/if}

    <Button
      variant={isLiked ? "rosa" : "outline"}
      disabled={!authorized}
      type="submit"
      aria-pressed={isLiked}
    >
      <ThumbsUp class={isLiked ? "fill-current" : ""} />
      {m.news_like()}
      {#if count > 0}
        <span class="tabular-nums opacity-80">{count}</span>
      {/if}
    </Button>
  </form>
{:else}
  <!-- Logged-out readers can't like; offer the way in instead of a dead, disabled button. -->
  <Button variant="outline" onclick={() => signIn()}>
    <ThumbsUp />
    {m.news_logInToLike()}
    {#if count > 0}
      <span class="tabular-nums opacity-80">{count}</span>
    {/if}
  </Button>
{/if}
