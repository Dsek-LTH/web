<script lang="ts">
  import { page } from "$app/stores";
  import type { Member } from "@prisma/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";
  import type { LikeSchema } from "./likes";
  import apiNames from "$lib/utils/apiNames";

  export let likers: Member[];
  $: disabled = !$page.data.accessPolicies.includes(apiNames.NEWS.LIKE);
  export let articleId: string;
  export let likeForm: SuperValidated<LikeSchema>;
  const { errors, constraints, enhance } = superForm(likeForm, {
    id: articleId, // needs to be unique since there could be multiple like buttons on a page
  });
  $: isLiked = likers.some((member) => member.studentId === $page.data.session?.user?.student_id);
</script>

<form method="POST" action="?/{isLiked ? 'dislike' : 'like'}" use:enhance>
  <input type="hidden" value={articleId} name="articleId" {...$constraints} />
  {#if $errors.articleId}
    <div class="text-error">{$errors.articleId}</div>
  {/if}
  <div class="tooltip m-4" data-tip={disabled ? "Du måste vara inloggad för att gilla" : undefined}>
    <button {disabled} type="submit">
      <label class="swap">
        <!-- this hidden checkbox controls the state -->
        <input type="checkbox" checked={isLiked} />

        <!-- volume on icon -->
        <span class="swap-on i-mdi-thumb-up h-10 w-10"> </span>

        <span class="swap-off i-mdi-thumb-up-outline h-10 w-10"> </span>
      </label>
    </button>
  </div>
</form>
