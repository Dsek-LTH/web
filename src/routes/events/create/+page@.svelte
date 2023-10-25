<script lang="ts">
  import EventEditor from "../EventEditor.svelte";

  // import Tiptap from "$lib/TipTap.svelte";
  export let data;
  export let form;
</script>

<EventEditor {...data} formData={form?.data}>
  <div slot="error">
    {#if form?.error}
      <p class="text-error">{form.error}</p>
    {/if}
  </div>
</EventEditor>
