<script lang="ts">
  import * as m from "$paraglide/messages";

  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import EventEditor from "../EventEditor.svelte";
  import type { PageData } from "./$types";
  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<SetPageTitle title={m.events_createEvent()} />

<EventEditor
  data={data.form}
  allTags={data.allTags}
  recurringParentId={null}
  creating
/>
