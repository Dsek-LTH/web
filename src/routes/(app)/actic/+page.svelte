<script lang="ts">
  import { onMount } from "svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Card, CardContent } from "$lib/components/ui/card/index.js";
  import { DOCUMENT_TYPES, FAMILIES, getDocumentType } from "$lib/actic/dsek";
  import { deleteDraft, listDrafts, type Draft } from "$lib/actic/drafts";
  import * as m from "$paraglide/messages";
  import Trash2 from "@lucide/svelte/icons/trash-2";

  let drafts = $state<Draft[]>([]);

  // Drafts live in localStorage, so only read them on the client.
  onMount(() => {
    drafts = listDrafts();
  });

  function remove(id: string) {
    deleteDraft(id);
    drafts = listDrafts();
  }

  const groups = $derived([
    {
      key: "meetings",
      label: m.actic_landing_group_meetings(),
      types: DOCUMENT_TYPES.filter(
        (t) => FAMILIES.find((f) => f.id === t.family)?.group === "meetings",
      ),
    },
    {
      key: "other",
      label: m.actic_landing_group_other(),
      types: DOCUMENT_TYPES.filter(
        (t) => FAMILIES.find((f) => f.id === t.family)?.group === "other",
      ),
    },
  ]);

  function relativeTime(timestamp: number): string {
    const minutes = Math.round((Date.now() - timestamp) / 60000);
    const formatter = new Intl.RelativeTimeFormat(m.locale(), {
      numeric: "auto",
    });
    if (Math.abs(minutes) < 60) return formatter.format(-minutes, "minute");
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return formatter.format(-hours, "hour");
    return formatter.format(-Math.round(hours / 24), "day");
  }
</script>

<SetPageTitle title={m.actic_title()} />

<div class="layout-container flex flex-col gap-6">
  <div class="flex max-w-2xl flex-col gap-2">
    <h1 class="text-3xl font-bold">{m.actic_title()}</h1>
    <p class="text-muted-foreground">{m.actic_description()}</p>
  </div>

  <div class="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
    <section class="flex flex-col gap-3">
      <h2 class="text-sm font-bold tracking-widest uppercase">
        {m.actic_landing_drafts()}
      </h2>
      {#each drafts as draft (draft.id)}
        <div
          class="border-border flex items-center justify-between gap-3 rounded-md border p-3"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">
              {draft.title || draft.meeting || m.actic_landing_untitled()}
            </p>
            <p class="text-muted-foreground truncate text-xs">
              {getDocumentType(draft.type).label()}{draft.meeting
                ? " · " + draft.meeting
                : ""} · {relativeTime(draft.updatedAt)}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <Button
              size="sm"
              href={`/actic/write/${draft.family}?draft=${draft.id}`}
              >{m.actic_landing_open()}</Button
            >
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={m.actic_landing_delete()}
              onclick={() => remove(draft.id)}
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>
      {:else}
        <p class="text-muted-foreground text-sm">
          {m.actic_landing_no_drafts()}
        </p>
      {/each}
    </section>

    <section class="flex flex-col gap-5">
      <h2 class="text-sm font-bold tracking-widest uppercase">
        {m.actic_landing_create()}
      </h2>
      {#each groups as group (group.key)}
        {#if group.types.length > 0}
          <div class="flex flex-col gap-2">
            <h3 class="text-muted-foreground text-xs font-medium">
              {group.label}
            </h3>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {#each group.types as type (type.id)}
                <a
                  href={`/actic/write/${type.family}`}
                  class="group"
                  onclick={() =>
                    sessionStorage.setItem("actic.newType", type.id)}
                >
                  <Card
                    class="h-full transition-all group-hover:-translate-y-1 group-hover:shadow-xl"
                  >
                    <CardContent class="flex h-full flex-col gap-1 p-4">
                      <h3 class="text-lg font-bold">{type.label()}</h3>
                      <p class="text-muted-foreground text-xs leading-relaxed">
                        {type.blurb()}
                      </p>
                    </CardContent>
                  </Card>
                </a>
              {/each}
            </div>
          </div>
        {/if}
      {/each}
    </section>
  </div>
</div>
