<script lang="ts">
  import EventEditor from "../../EventEditor.svelte";

  export let data;
</script>

<svelte:head>
  <title>Redigera evenemang | D-sektionen</title>
</svelte:head>

<EventEditor data={data.form} allTags={data.allTags} />
