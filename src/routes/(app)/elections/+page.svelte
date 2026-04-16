<script lang="ts">
  import type { PageData } from "./$types";
  import * as m from "$paraglide/messages";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  import dayjs from "dayjs";
  import utc from "dayjs/plugin/utc";
  import timezone from "dayjs/plugin/timezone";
  import { Button } from "$lib/components/ui/button";
  import ElectionCard from "./ElectionCard.svelte";

  let { data }: { data: PageData } = $props();

  dayjs.extend(utc);
  dayjs.extend(timezone);
</script>

<div class="layout-container">
  <div class="flex flex-row">
    <h1>{m.openElections()}</h1>
    {#if isAuthorized(apiNames.ELECTION.CREATE, data.user)}
      <a href="/elections/create" class="ml-auto"><Button>+ Nytt val</Button></a
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
