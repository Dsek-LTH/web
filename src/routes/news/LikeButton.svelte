<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import type { Member } from "@prisma/client";

  export let likers: Member[];
  export let disabled: boolean = false;
  $: isLiked = likers.some((member) => member.studentId === $page.data.session?.user?.student_id);
</script>

<form
  method="POST"
  action="?/{isLiked ? 'dislike' : 'like'}"
  use:enhance={() => {
    return async ({ update, result }) => {
      if (result.type === "failure") {
        // todo: handle error
      }
      await update();
    };
  }}
>
  <slot name="hidden-input" />
  <div class="tooltip m-4" data-tip={disabled ? "Du måste vara inloggad för att gilla" : undefined}>
    <button {disabled}>
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
