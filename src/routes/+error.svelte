<script>
  import { page } from "$app/stores";
</script>

<main class="gap flex flex-col items-center gap-2 pt-20">
  <h1 class="text-6xl font-bold">{$page.status}</h1>
  {#if $page.error?.statusDescription}
    <h3>{$page.error.statusDescription}</h3>
  {/if}
  {#if $page.error?.message}
    <h2 class="mt-4 text-xl">{$page.error.message}</h2>
  {/if}
</main>
