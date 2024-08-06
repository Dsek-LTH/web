<script lang="ts">
  import { page } from "$app/stores";
  import { codeToMessage } from "$lib/utils/codeToMessage";
</script>

<main class="gap flex flex-1 flex-col items-center gap-2 pt-20">
  <h1 class="text-6xl font-bold">{$page.status}</h1>
  <h3>
    {($page.error?.statusDescription ?? $page.status in codeToMessage)
      ? codeToMessage[$page.status]
      : ""}
  </h3>
  {#if $page.error?.message}
    <h2 class="mt-4 text-xl">{$page.error.message}</h2>
  {/if}
</main>
