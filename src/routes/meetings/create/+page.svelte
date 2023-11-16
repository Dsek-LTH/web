<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import MeetingEditor from "../MeetingEditor.svelte";

  export let data;
</script>

<PageHeader title="Skapa möte" />

<MeetingEditor data={data.form} action="/meetings/create">
  <button type="submit" class="btn btn-primary mt-4 self-start"> Skapa </button>
</MeetingEditor>
