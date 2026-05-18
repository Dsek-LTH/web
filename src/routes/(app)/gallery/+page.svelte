<script lang="ts">
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import AlbumCard from "./AlbumCard.svelte";
  import type { PageProps } from "./$types";
  import type { AlbumSchema } from "./schema";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  import { PUBLIC_BUCKETS_ALBUMS } from "$env/static/public";

  let { data }: PageProps = $props();
  let albums: AlbumSchema[] = $derived(data.albums);
  let canCreate = $derived(
    isAuthorized(
      apiNames.FILES.BUCKET(PUBLIC_BUCKETS_ALBUMS).CREATE,
      data.user,
    ),
  );
</script>

<SetPageTitle title={m.gallery()} />

<div class="layout-container">
  <h1 class="text-3xl font-bold">{m.gallery()}</h1>

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
      {#each albums as album (album)}
        <AlbumCard class="" {album} />
      {/each}
    </div>
  </div>
</div>
