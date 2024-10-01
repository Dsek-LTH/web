<script lang="ts">
  import EventEditor from "../../EventEditor.svelte";
  import * as m from "$paraglide/messages";

  import type { PageData } from "./$types";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  export let data: PageData;
</script>

<SetPageTitle title={m.events_editEvent()} />

<EventEditor data={data.form} allTags={data.allTags} recurringParentId={data.recurringParentId} />
