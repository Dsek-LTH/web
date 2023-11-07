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
  <button type="submit" class="btn btn-primary" {disabled}>
    {isLiked ? "Sluta gilla" : "Gilla"}
  </button>
</form>
