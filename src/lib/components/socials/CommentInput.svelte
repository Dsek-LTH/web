<script lang="ts">
  import { enhance } from "$app/forms";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import type { Member } from "@prisma/client";
  export let author: Member;
  export let value: string | undefined = undefined;
  export let error: string | undefined = undefined;
</script>

<div class="flex items-end gap-4">
  <MemberAvatar member={author} class="w-12 rounded-lg" />
  <div class="flex flex-1 flex-col">
    <label class="label w-auto self-start" for="comment">
      <span class="label-text">Kommentera</span>
    </label>
    <form class="join join-horizontal w-full" method="POST" action="?/comment" use:enhance>
      <input
        id="comment"
        name="content"
        type="text"
        class="input join-item input-bordered w-full"
        value={value ?? ""}
      />
      <button type="submit" class="btn btn-primary join-item">Skicka</button>
    </form>
  </div>
  {#if error}
    <p class="text-error">{error}</p>
  {/if}
</div>
