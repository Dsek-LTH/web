<script lang="ts">
  import EventCreator from "./EventCreator.svelte";

  import type { PageData } from "./$types";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  export let data: PageData;
</script>

<SetPageTitle title="Skapa evenemang" />

<EventCreator data={data.form} allTags={data.allTags} />
