<script lang="ts">
  import ActivityButton from "./ActivityButton.svelte";
  import * as m from "$paraglide/messages";
  import { languageTag } from "$paraglide/runtime";

  import type { Event } from "@prisma/client";
  import { eventLink } from "$lib/utils/redirect";
  export let events: Event[];
</script>

<h2 class="mb-2 text-lg">{m.members_publishedEvents()}</h2>
<div class="flex flex-col gap-2">
  {#each events as event (event.id)}
    <ActivityButton
      link={eventLink(event)}
      title={event.title}
      rightAdornment={event.startDatetime?.toLocaleDateString(languageTag())}
    />
  {/each}
</div>
