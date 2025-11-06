<script lang="ts">
  import * as m from "$paraglide/messages";

  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import type { PageProps } from "./$types";
  import { isAuthorized } from "$lib/utils/authorization";
  import { PUBLIC_BUCKETS_ALBUMS } from "$env/static/public";
  import apiNames from "$lib/utils/apiNames";
  import AlbumCard from "./AlbumCard.svelte";
  let { data }: PageProps = $props();

  let canCreate = $state(
    isAuthorized(
      apiNames.FILES.BUCKET(PUBLIC_BUCKETS_ALBUMS).CREATE,
      data.user,
    ),
  );
</script>

<SetPageTitle title={m.gallery()} />

<h1 class="text-2xl font-bold">{m.gallery()}</h1>
<div class="flex flex-row flex-wrap justify-between">
  {#if canCreate}
    <div class="my-4 flex flex-row gap-1">
      <a class="btn btn-primary btn-sm" href="/gallery/upload"
        >+ {m.gallery_create_album()}</a
      >
    </div>
  {/if}
</div>

<div class="flex flex-col gap-4">
  <div
    class="grid grid-cols-1 items-stretch justify-items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3"
  >
    {#each data.albums as album (album)}
      <AlbumCard {album} />
    {/each}
  </div>
</div>
