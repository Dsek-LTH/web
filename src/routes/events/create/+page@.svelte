<script lang="ts">
  import EventEditor from "../EventEditor.svelte";

  // import Tiptap from "$lib/TipTap.svelte";
  export let data;
  export let form;
</script>

<svelte:head>
  <title>Skapa evenemang | D-sektionen</title>
</svelte:head>

<EventEditor {...data} formData={form?.data}>
  <div slot="error">
    {#if form?.error}
      <p class="text-error">{form.error}</p>
    {/if}
  </div>
</EventEditor>
