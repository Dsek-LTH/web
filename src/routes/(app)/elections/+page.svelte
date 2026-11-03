<script lang="ts">
  import type { PageData } from "./$types";
  import * as m from "$paraglide/messages";
  import apiNames from "$lib/utils/apiNames";
  import { Button } from "$lib/components/ui/button";
  import ElectionCard from "$lib/components/ElectionCard.svelte";

  let { data }: { data: PageData } = $props();
</script>

<div class="layout-container">
  <div class="flex flex-row">
    <h1>{m.openElections()}</h1>
    {#if data.user?.policies.includes(apiNames.ELECTION.CREATE)}
      <Button href="/elections/create" class="ml-auto"
        >+ {m.elections_new()}</Button
      >
    {/if}
  </div>

  <p class="my-4">
    {m.elections_description()}
  </p>

  <section
    class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
  >
    {#each data.openElections as election, index (election.id)}
      <ElectionCard {election} user={data.user} {index} />
    {/each}
  </section>
</div>
