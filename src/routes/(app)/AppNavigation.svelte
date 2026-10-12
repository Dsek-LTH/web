<script lang="ts">
  import { page } from "$app/state";
  import DsekLogo from "$lib/components/DsekLogo.svelte";
  import { cn } from "$lib/utils";
  import { Calendar, FileText, Menu, Newspaper } from "@lucide/svelte";

  const PAGES = [
    { title: "Home", icon: DsekLogo, link: "/app/home" },
    { title: "News", icon: Newspaper, link: "/news" },
    { title: "Events", icon: Calendar, link: "/events" },
    { title: "Documents", icon: FileText, link: "/documents" },
    { title: "Menu", icon: Menu, link: "/app/navigation" },
  ];
</script>

<div class="flex w-full justify-center">
  <nav
    class="bg-muted-background fixed bottom-0 z-500 mb-2 flex h-16 w-[95%] flex-row items-center justify-around rounded-lg border-[1px] px-4 shadow-lg *:size-full"
  >
    {#each PAGES as item (item.title)}
      {@const Icon = item.icon}
      <a
        href={item.link}
        class={cn(
          "flex h-16 items-center justify-center py-4 *:size-[85%]",
          page.url.pathname == item.link
            ? "text-rosa-background border-rosa-background border-b-4 pt-4 pb-3"
            : "text-muted-foreground",
        )}
      >
        <Icon />
      </a>
    {/each}
  </nav>
</div>
