<script lang="ts">
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  import { page } from "$app/state";
  import PictureWall from "./PictureWall.svelte";
  import MemberList from "./MemberList.svelte";
  import type { FileData } from "$lib/files/fileHandler";
  import type { AlbumSchema } from "../../schema";

  let {
    data,
  }: {
    data: {
      pictures: FileData[];
      album: AlbumSchema | null;
    };
  } = $props();

  let pictures = $derived(data.pictures);

  const canEdit = $derived(
    isAuthorized(apiNames.GALLERY.UPDATE, page.data.user),
  );
</script>

<SetPageTitle title={m.gallery_album() + " - " + data.album?.title} />

<div class="layout-container">
  <a href="/gallery" class="btn btn-outline btn-sm m-2">{m.gallery_back()}</a>
  {#if canEdit}
    <a
      href={`/gallery/album/${data.album?.slug}/edit`}
      class="btn btn-outline btn-sm m-2"
    >
      {m.gallery_edit_album()}
    </a>
  {/if}
  <div class="flex flex-col">
    <div class="flex flex-row items-center justify-between p-3">
      <h1 class="text-2xl">{data.album?.title}</h1>
      <span class="">{data.album?.date.split("T")[0]}</span>
    </div>
    {#if data.album?.description}
      <div class="px-3">
        <p class="whitespace-pre-wrap">{data.album?.description}</p>
      </div>
    {/if}
    <div class="flex flex-col gap-1 px-3">
      {#if data.album?.photographers}
        <MemberList
          members={data.album.photographers}
          titleSingular={m.gallery_photographer()}
          titlePlural={m.gallery_photographers()}
        />
      {/if}
      {#if data.album?.editors}
        <MemberList
          members={data.album.editors}
          titleSingular={m.gallery_editor()}
          titlePlural={m.gallery_editors()}
        />
      {/if}
    </div>
  </div>
  <PictureWall {pictures} />
</div>
