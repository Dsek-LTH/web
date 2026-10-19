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
  import { buttonVariants } from "$lib/components/ui/button";
  import { cn } from "$lib/utils";
  import { Pen } from "@lucide/svelte";

  let {
    data,
  }: {
    data: {
      pictures: FileData[];
      cover: FileData | null;
      album: AlbumSchema | null;
    };
  } = $props();

  let pictures = $derived(data.pictures);
  let cover = $derived(data.cover);
  const canEdit = $derived(
    isAuthorized(apiNames.GALLERY.UPDATE, page.data.user),
  );
</script>

<SetPageTitle title={m.gallery_album() + " - " + data.album?.title} />

<div class="layout-container">
  <div class="flex flex-row items-center justify-between pb-3">
    <a
      href="/gallery"
      class={buttonVariants({ size: "sm", variant: "outline" })}
      >{m.gallery_back()}</a
    >
    {#if canEdit}
      <a
        href={`/gallery/album/${data.album?.slug}/edit`}
        class={cn(
          buttonVariants({ size: "sm", variant: "outline" }),
          "ml-auto",
        )}
      >
        <Pen />
        {m.gallery_edit_album()}
      </a>
    {/if}
  </div>
  <div class="flex flex-col">
    <div class="flex flex-row gap-2 py-4">
      <div class="max-w-1/3 pr-3">
        <img
          class="rounded-md object-contain"
          src={cover?.thumbnailUrl}
          alt="display"
        />
      </div>
      <div class="flex min-h-full w-full flex-col justify-between gap-2">
        <div class="flex flex-row items-center justify-between">
          <h1 class="text-5xl">{data.album?.title}</h1>
          <span class="">{data.album?.date.split("T")[0]}</span>
        </div>
        {#if data.album?.description}
          <div class="grow">
            <p class="whitespace-pre-wrap">{data.album?.description}</p>
          </div>
        {/if}
        <div class="flex flex-row gap-2">
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
    </div>
  </div>
  <PictureWall {pictures} />
</div>
