<script lang="ts">
  import apiNames from "$lib/utils/apiNames";
  import Disclaimer from "../Disclaimer.svelte";
  import SongElement from "../SongElement.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<svelte:head>
  <title>{data.song.title} | D-sektionen</title>
  <meta name="description" content={data.song.lyrics} />
</svelte:head>

<SongElement
  song={data.song}
  accessPolicies={data.accessPolicies}
  class="my-0 p-0 shadow-none ring-transparent"
/>

<Disclaimer />

{#if data.accessPolicies.includes(apiNames.SONG.UPDATE)}
  <div class="my-4 flex justify-between">
    <a class="btn" href={`/songbook/${data.song.slug}/edit`}>Redigera</a>
  </div>
{/if}
