<script lang="ts">
  import { enhance } from "$app/forms";
  import type { SubmitFunction } from "@sveltejs/kit";

  export let action: string;
  export let warningMessage: string | null = null;
  export let consumableId: string;

  let isLoading = false;

  $: enhanceMethod = ({
    cancel,
  }: Parameters<SubmitFunction>[0]): ReturnType<SubmitFunction> => {
    isLoading = true;
    if (warningMessage !== null && !confirm(warningMessage)) cancel();
    return ({ update }) => {
      isLoading = false;
      update();
    };
  };
</script>

<form method="POST" {action} use:enhance={enhanceMethod}>
  <input type="hidden" name="consumableId" value={consumableId} />
  <button class="btn btn-ghost">
    {#if isLoading}
      <span class="loading loading-spinner loading-sm"></span>
    {:else}
      <slot />
    {/if}
  </button>
</form>
