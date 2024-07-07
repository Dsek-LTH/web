<script lang="ts">
  import EventCreator from "./EventCreator.svelte";
  import * as m from "$paraglide/messages";

  import type { PageData } from "./$types";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  export let data: PageData;
</script>

<SetPageTitle title={m.events_createEvent()} />

<EventCreator data={data.form} allTags={data.allTags} />
