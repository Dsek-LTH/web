<script lang="ts">
  import { enhance } from "$app/forms";
  import type { SubmitFunction } from "@sveltejs/kit";

  interface Props {
    action: string;
    warningMessage?: string | null;
    consumableId: string;
    children?: import("svelte").Snippet;
  }

  let {
    action,
    warningMessage = null,
    consumableId,
    children,
  }: Props = $props();

  let isLoading = $state(false);

  let enhanceMethod = $derived(
    ({ cancel }: Parameters<SubmitFunction>[0]): ReturnType<SubmitFunction> => {
      if (warningMessage !== null && !confirm(warningMessage)) cancel();
      else isLoading = true;
      return ({ update }) => {
        isLoading = false;
        update();
      };
    },
  );
</script>

<form method="POST" {action} use:enhance={enhanceMethod}>
  <input type="hidden" name="consumableId" value={consumableId} />
  <button class="btn btn-ghost">
    {#if isLoading}
      <span class="loading loading-spinner loading-sm"></span>
    {:else}
      {@render children?.()}
    {/if}
  </button>
</form>
