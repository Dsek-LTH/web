<script lang="ts">
  import EventEditor from "../EventEditor.svelte";

  // import Tiptap from "$lib/TipTap.svelte";
  export let data;
</script>

<svelte:head>
  <title>Skapa evenemang | D-sektionen</title>
</svelte:head>

<EventEditor data={data.form} allTags={data.allTags} />
