<script lang="ts">
  import EventEditor from "../EventEditor.svelte";

  // import Tiptap from "$lib/TipTap.svelte";
  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<svelte:head>
  <title>Skapa evenemang | D-sektionen</title>
</svelte:head>

<EventEditor data={data.form} allTags={data.allTags} />
