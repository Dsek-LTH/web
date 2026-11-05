<script lang="ts">
  import YearSelector from "$lib/components/YearSelector.svelte";
  import { type PageData } from "./$types";
  import PhadderGroup from "./PhadderGroup.svelte";
  import { Button } from "$lib/components/ui/button";
  import apiNames from "$lib/utils/apiNames";
  import * as m from "$paraglide/messages";

  let { data }: { data: PageData } = $props();
</script>

<div
  class="mb-8 flex w-full flex-col justify-between gap-2 md:flex-row md:gap-8"
>
  <h2>{m.phadderGroups()}</h2>
  <div class="flex items-center gap-2">
    {#if data.user?.policies.includes(apiNames.NOLLNING.MANAGE_PHADDER_GROUPS)}
      <Button href="/committees/nollu/groups/manage" variant="outline">
        {m.nollu_manage_pageTitle()}
      </Button>
    {/if}
    <YearSelector />
  </div>
</div>

<div class="flex flex-row flex-wrap justify-center gap-4 md:justify-start">
  {#each data.phadderGroups as phadderGroup (phadderGroup.id)}
    <PhadderGroup group={phadderGroup} />
  {/each}
</div>
