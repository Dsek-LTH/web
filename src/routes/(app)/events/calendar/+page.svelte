<script lang="ts">
  import Calendar from "./Calendar.svelte";

  import type { PageData } from "./$types";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  export let data: PageData;
</script>

<SetPageTitle title="Kalender" />

<a class="btn" href="/events">
  <span class="i-mdi-format-list-bulleted" />
  Lista
</a>
<Calendar events={data.events} />
