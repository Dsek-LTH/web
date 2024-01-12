<script lang="ts">
  import apiNames from "$lib/utils/apiNames";
  import Disclaimer from "../Disclaimer.svelte";
  import SongElement from "../SongElement.svelte";

  export let data;
</script>

<SongElement song={data.song} />

{#if data.accessPolicies.includes(apiNames.SONG.DELETE)}
  <form
    method="POST"
    action="?/delete"
    class="form-control gap-2"
    on:submit={async (event) => {
      if (!confirm("Är säker på att du vill ta bort sången?")) {
        event.preventDefault();
        return;
      }
      if (
        !confirm(
          `D-sektionens sångarkiv är viktigt för att bevara vår historia. 
Är du verkligen helt säker på att du vill ta bort sången?`,
        )
      ) {
        event.preventDefault();
        return;
      }
      if (
        !confirm("Detta går inte att ångra! Förstår du innebörden av detta?")
      ) {
        event.preventDefault();
        return;
      }
    }}
  >
    <input type="hidden" name="id" value={data.song.id} />
    <button
      class="btn btn-error w-fit
    "
    >
      Ta bort
    </button>
  </form>
{/if}

<Disclaimer />
