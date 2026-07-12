<script lang="ts">
  import type { Snippet } from "svelte";
  import { page } from "$app/state";
  import { cn } from "$lib/utils";

  let { children }: { children: Snippet } = $props();

  const tabs = [
    { path: "/admin/stocklist", label: "Översikt" },
    { path: "/admin/stocklist/showproducts", label: "Produkter" },
    { path: "/admin/stocklist/stockchange", label: "Skriv in/ut" },
    { path: "/admin/stocklist/treasury", label: "Loggar" },
  ];

  let activeTab = $derived(page.url.pathname);
</script>

<main class="layout-container flex flex-col gap-6">
  <div class="flex flex-col gap-2">
    <h2>Lagerlista</h2>
    <p class="text-muted-foreground">Administrera sexets alkohollager</p>
  </div>

  <div class="border-muted flex gap-4 overflow-x-auto border-b pb-px">
    {#each tabs as tab (tab.path)}
      {@const isActive = activeTab === tab.path}
      <a
        href={tab.path}
        class={cn(
          "border-b-2 pb-2 text-sm font-medium whitespace-nowrap transition-all",
          isActive
            ? "border-rosa text-rosa"
            : "text-muted-foreground hover:text-foreground hover:border-muted border-transparent",
        )}
      >
        {tab.label}
      </a>
    {/each}
  </div>

  <section class="min-h-[500px]">
    {@render children()}
  </section>
</main>
