<script lang="ts">
  import * as Alert from "$lib/components/ui/alert/index.js";
  import { page } from "$app/state";
  import { page as pageStore } from "$app/stores";
  import { toast, toasts } from "$lib/stores/toast";
  import { getFlash } from "sveltekit-flash-message";

  const flash = getFlash(pageStore);

  // Message from form (not redirect)
  $effect(() => {
    if (page.form?.form?.message && page.form.form.message.type !== "hidden") {
      toast(
        page.form.form.message.message,
        page.form.form.message.type,
        page.form.form.message.id,
      );
    }
  });

  // Message from form on redirect
  $effect(() => {
    if ($flash && $flash.type !== "hidden") {
      toast($flash.message, $flash.type, $flash.id);
    }
  });

  const toastLocationClasses = $derived(
    !page.data.isApp
      ? "bottom-10 right-10"
      : "toast-top toast-center w-full flex-col-reverse items-center",
  );
</script>

{#if $toasts.length > 0}
  <div
    class="toast absolute z-10 {toastLocationClasses}"
    style={page.data.isApp
      ? `top: ${64 + (page.data.appInfo?.insets.top ?? 0)}px;`
      : ""}
  >
    {#each $toasts as t (t.id)}
      <Alert.Root
        class="mt-5"
        variant={t.type === "error" ? "destructive" : "default"}
      >
        <Alert.Title>{t.type}</Alert.Title>
        <Alert.Description>{t.message}</Alert.Description>
      </Alert.Root>
    {/each}
  </div>
{/if}
