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
  <div class="toast bottom-2 right-2">
    {#each $toasts as toast (toast.id)}
      <div
        role="alert"
        class="alert alert-{toast.type}"
        out:fade={{ duration: 750 }}
      >
        {toast.message}
      </div>
    {/each}
  </div>
{/if}
