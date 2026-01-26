<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import Disclaimer from "../Disclaimer.svelte";
  import SongElement from "../SongElement.svelte";
  import * as m from "$paraglide/messages";
  import type { AuthUser } from "@zenstackhq/runtime";

  import type { PageData } from "./$types";
  export let data: PageData;

  // This exist to make svansen of spritbolaget private to members.
  function mayWatchVideos(user: AuthUser): boolean {
    return user.roles.some((user) => ["C", "D", "VR/AR"].includes(user));
  }

  console.log(data.user);
</script>

<SetPageTitle title={data.song.title} />
<svelte:head>
  <meta name="description" content={data.song.lyrics} />
</svelte:head>

<SongElement song={data.song} class="my-0 p-0 shadow-none ring-transparent" />

{#if data.song.video !== null && mayWatchVideos(data.user)}
  <video controls class="pb-8 pt-8">
    <source src={data.song.video} />
    <track kind="captions" />
  </video>
{/if}

<Disclaimer />

{#if isAuthorized(apiNames.SONG.UPDATE, data.user)}
  <div class="my-4 flex justify-between">
    <a class="btn" href={`/songbook/${data.song.slug}/edit`}
      >{m.songbook_edit()}</a
    >
  </div>
{/if}
