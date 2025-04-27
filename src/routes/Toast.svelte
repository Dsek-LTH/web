<script lang="ts">
  import { page } from "$app/stores";
  import { toast, toasts } from "$lib/stores/toast";
  import { fade } from "svelte/transition";
  import { getFlash } from "sveltekit-flash-message";

  const flash = getFlash(page);
  // Message from form (not redirect)
  $effect(() => {
    if (
      $page.form?.form?.message &&
      $page.form.form.message.type !== "hidden"
    ) {
      toast(
        $page.form.form.message.message,
        $page.form.form.message.type,
        $page.form.form.message.id,
      );
    }
  });

  // Message from form on redirect
  $effect(() => {
    if ($flash && $flash.type !== "hidden") {
      toast($flash.message, $flash.type, $flash.id);
    }
  });

  let toastLocationClasses = $derived(
    (() => {
      if (!$page.data.isApp) return "bottom-2 right-2";
      return `toast-top toast-center w-full flex-col-reverse items-center`;
    })(),
  );
</script>

{#if $toasts.length > 0}
  <div
    class="toast z-10 {toastLocationClasses}"
    style={$page.data.isApp
      ? `top: ${64 + ($page.data.appInfo?.insets.top ?? 0)}px;`
      : ""}
  >
    {#each $toasts as toast (toast.id)}
      <div
        role="alert"
        class="alert alert-{toast.type} select-all"
        class:py-2={$page.data.isApp}
        class:px-6={$page.data.isApp}
        class:text-sm={$page.data.isApp}
        class:w-auto={$page.data.isApp}
        out:fade={{ duration: 750 }}
      >
        <span class="max-w-full select-all overflow-hidden text-ellipsis">
          {toast.message}
        </span>
      </div>
    {/each}
  </div>
{/if}
