<script lang="ts">
  import { page } from "$app/stores";
  import { toast, toasts } from "$lib/stores/toast";
  import { fade } from "svelte/transition";
  import { getFlash } from "sveltekit-flash-message";

  const flash = getFlash(page);
  // Message from form (not redirect)
  $: $page.form?.form?.message && $page.form.form.message.type !== "hidden"
    ? toast($page.form.form.message.message, $page.form.form.message.type)
    : null;
  // Message from form on redirect
  $: $flash && $flash.type !== "hidden"
    ? toast($flash.message, $flash.type)
    : null;
</script>

{#if $toasts}
  <div class="toast bottom-2 right-2 z-10">
    {#each $toasts as toast (toast.id)}
      <div
        role="alert"
        class="alert alert-{toast.type} select-all"
        out:fade={{ duration: 750 }}
      >
        <span class="max-w-full select-all overflow-hidden text-ellipsis">
          {toast.message}
        </span>
      </div>
    {/each}
  </div>
{/if}
