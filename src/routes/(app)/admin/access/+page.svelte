<script lang="ts">
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages.js";
  import Search from "@lucide/svelte/icons/search";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";

  let { data } = $props();

  let search = $state("");

  let filtered = $derived(
    search.trim()
      ? data.apiNames.filter((a) =>
          a.name.toLowerCase().includes(search.trim().toLowerCase()),
        )
      : data.apiNames,
  );

  let groups = $derived.by(() => {
    const map = new Map<string, typeof data.apiNames>();
    for (const entry of filtered) {
      const key = entry.name.includes(":")
        ? entry.name.split(":")[0]!
        : entry.name;
      map.set(key, [...(map.get(key) ?? []), entry]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  });

  let exactMatch = $derived(
    data.apiNames.some((a) => a.name === search.trim()),
  );
</script>

<SetPageTitle title={m.admin_access_pageTitle()} />

<div class="mx-auto max-w-2xl px-4 py-8">
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-3xl font-bold">{m.admin_access_pageTitle()}</h1>
    <Button href="/admin/access/positions" variant="outline">
      {m.admin_access_positionsPageTitle()}
    </Button>
  </div>

  <div class="relative mb-6">
    <Search
      class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
    />
    <Input
      bind:value={search}
      placeholder={m.admin_access_searchPlaceholder()}
      class="pl-9"
    />
  </div>

  {#if search.trim() && !exactMatch}
    <a href="/admin/access/{search.trim()}" class="mb-6 block">
      <Card
        class="hover:bg-muted/50 flex-row items-center justify-between p-4 transition-colors"
      >
        <span class="flex items-center gap-2">
          <ArrowRight class="text-muted-foreground h-4 w-4" />
          {m.admin_access_goToCustom({ name: search.trim() })}
        </span>
      </Card>
    </a>
  {/if}

  {#if groups.length === 0}
    <p class="text-muted-foreground">{m.admin_access_noMatches()}</p>
  {:else}
    <div class="flex flex-col gap-6">
      {#each groups as [prefix, entries] (prefix)}
        <Card>
          <CardHeader>
            <CardTitle class="font-mono text-base">{prefix}</CardTitle>
          </CardHeader>
          <CardContent class="flex flex-col divide-y">
            {#each entries as entry (entry.name)}
              <a
                href="/admin/access/{entry.name}"
                class="hover:bg-muted/50 -mx-2 flex items-center justify-between gap-4 rounded-md px-2 py-3 transition-colors"
              >
                <span class="font-mono text-sm">{entry.name}</span>
                <span class="flex items-center gap-2">
                  {#if entry.inUse}
                    <Badge variant="outline">
                      {entry.grantCount === 1
                        ? m.admin_access_grantCount_one()
                        : m.admin_access_grantCount({ count: entry.grantCount })}
                    </Badge>
                  {:else}
                    <Badge variant="outline" class="text-muted-foreground">
                      {m.admin_access_unused()}
                    </Badge>
                  {/if}
                  <ChevronRight class="text-muted-foreground h-4 w-4" />
                </span>
              </a>
            {/each}
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}
</div>
