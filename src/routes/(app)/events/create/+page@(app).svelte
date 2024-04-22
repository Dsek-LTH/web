<script lang="ts">
  import EventCreator from "./EventCreator.svelte";

  // import Tiptap from "$lib/TipTap.svelte";
  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<svelte:head>
  <title>Skapa evenemang | D-sektionen</title>
</svelte:head>

<EventCreator data={data.form} allTags={data.allTags} />
