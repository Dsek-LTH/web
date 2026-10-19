<script lang="ts">
  import * as Alert from "$lib/components/ui/alert/index.js";
  import { page } from "$app/state";
  import { toasts } from "$lib/stores/toast";
  import { CircleCheck, CircleX, Info, TriangleAlert } from "@lucide/svelte";

  const toastLocationClasses = $derived(
    !page.data.isApp
      ? "bottom-10 right-10"
      : "toast-top toast-center w-full flex-col-reverse items-center",
  );
</script>

{#snippet icon(
  type: "hidden" | "error" | "success" | "info" | "warning" | "primary",
)}
  {#if type == "success"}
    <CircleCheck />
  {:else if type == "error"}
    <CircleX />
  {:else if type == "info"}
    <Info />
  {:else if type == "warning"}
    <TriangleAlert />
  {/if}
{/snippet}

{#if $toasts.length > 0}
  <div
    class="toast fixed z-10 rounded-md {toastLocationClasses}"
    style={page.data.isApp
      ? `top: ${64 + (page.data.appInfo?.insets.top ?? 0)}px;`
      : ""}
  >
    {#each $toasts as t (t.id)}
      <div
        class="{t.removing
          ? 'animate-out fade-out'
          : 'fade-in slide-in-from-top-8 animate-in'} rounded-md shadow-md duration-300"
      >
        <Alert.Root class="mt-5" variant={t.type}>
          <Alert.Title class="text-lg"
            ><span class="flex items-center gap-2"
              >{@render icon(t.type)}{t.type.charAt(0).toUpperCase() +
                t.type.slice(1)}</span
            ></Alert.Title
          >
          <Alert.Description class="text-muted-foreground"
            >{t.message}</Alert.Description
          >
        </Alert.Root>
      </div>
    {/each}
  </div>
{/if}
