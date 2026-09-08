<script lang="ts">
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import PositionRow from "./PositionRow.svelte";
  import apiNames from "$lib/utils/apiNames";
  import * as m from "$paraglide/messages.js";

  let { data } = $props();

  let canUpdate = $derived(
    data.user?.policies?.includes(apiNames.POSITION.UPDATE) ?? false,
  );

  let groups = $derived.by(() => {
    const map = new Map<string, typeof data.positions>();
    for (const position of data.positions) {
      const key = position.committee?.name ?? m.positions_noCommittee();
      map.set(key, [...(map.get(key) ?? []), position]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  });
</script>

<SetPageTitle title={m.positions_pageTitle()} />

<div class="mx-auto max-w-4xl px-4 py-8">
  <h1 class="mb-6 text-3xl font-bold">{m.positions_pageTitle()}</h1>

  <div class="flex flex-col gap-6">
    {#each groups as [committeeName, positions] (committeeName)}
      <Card>
        <CardHeader>
          <CardTitle>{committeeName}</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col divide-y">
          {#each positions as position (position.id)}
            <PositionRow
              {position}
              updateForm={data.updateForms[position.id]}
              {canUpdate}
            />
          {/each}
        </CardContent>
      </Card>
    {/each}
  </div>
</div>
