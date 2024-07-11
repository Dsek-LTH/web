<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import Disclaimer from "../Disclaimer.svelte";
  import SongElement from "../SongElement.svelte";
  import * as m from "$paraglide/messages";

  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<SetPageTitle title={data.song.title} />
<svelte:head>
  <meta name="description" content={data.song.lyrics} />
</svelte:head>

<SongElement song={data.song} class="my-0 p-0 shadow-none ring-transparent" />

<Disclaimer />

{#if isAuthorized(apiNames.SONG.UPDATE, data.user)}
  <div class="my-4 flex justify-between">
    <a class="btn" href={`/songbook/${data.song.slug}/edit`}
      >{m.songbook_edit()}</a
    >
  </div>
{/if}
