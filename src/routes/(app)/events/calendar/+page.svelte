<script lang="ts">
  import Calendar from "./Calendar.svelte";
  import * as m from "$paraglide/messages";

  import type { PageData } from "./$types";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  export let data: PageData;
</script>

<SetPageTitle title={m.events_calendar()} />

<a class="btn" href="/events">
  <span class="i-mdi-format-list-bulleted" />
  {m.events_calendar_list()}
</a>
<Calendar events={data.events} />
