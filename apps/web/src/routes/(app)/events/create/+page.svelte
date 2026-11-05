<script lang="ts">
  import type { SuperForm } from "sveltekit-superforms";

  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import type { EventFormSchema } from "$lib/events/schema";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";

  import EventEditor from "../EventEditor.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  // svelte-ignore state_referenced_locally
  const superform = superForm(data.form, {
    dataType: "json",
    id: "createpage",
    delayMs: 500,
  });
</script>

<SetPageTitle title={m.events_createEvent()} />

<EventEditor
  creating
  superform={superform as unknown as SuperForm<EventFormSchema>}
  allTags={data.allTags}
  committees={data.committees}
  cancelHref="/events"
/>
