<script lang="ts">
  import * as m from "$paraglide/messages";

  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import EventEditor from "../EventEditor.svelte";
  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<SetPageTitle title={m.events_createEvent()} />

<EventEditor data={data.form} allTags={data.allTags} creating />
