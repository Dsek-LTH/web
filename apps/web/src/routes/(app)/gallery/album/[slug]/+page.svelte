<script lang="ts">
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import PictureWall from "./PictureWall.svelte";
  import MemberList from "./MemberList.svelte";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import type { PageProps } from "./$types";
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import { cn } from "$lib/utils";
  import { Pen } from "@lucide/svelte";

  let { data }: PageProps = $props();

  let album = $derived(data.album);
</script>

<SetPageTitle title={m.gallery_album() + " - " + album.title} />

<div class="layout-container">
  <div class="flex flex-row items-center justify-between pb-3">
    <Button href="/gallery" variant="ghost"
      ><ArrowLeft />{m.gallery_back()}</Button
    >
    {#if album.canEdit}
      <a
        href={`/gallery/album/${album.slug}/edit`}
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
        {#if album.cover}
          <img
            class="rounded-md object-contain"
            src={album.cover.url}
            alt={album.title}
          />
        {/if}
      </div>
      <div class="flex min-h-full w-full flex-col justify-between gap-2">
        <div class="flex flex-row items-center justify-between">
          <h1 class="text-5xl">{album.title}</h1>
          <span>{album.date}</span>
        </div>
        {#if album.description}
          <div class="grow">
            <p class="whitespace-pre-wrap">{album.description}</p>
          </div>
        {/if}
        <div class="flex flex-row gap-2">
          {#if album.photographers.length > 0}
            <MemberList
              members={album.photographers}
              titleSingular={m.gallery_photographer()}
              titlePlural={m.gallery_photographers()}
            />
          {/if}
          {#if album.editors.length > 0}
            <MemberList
              members={album.editors}
              titleSingular={m.gallery_editor()}
              titlePlural={m.gallery_editors()}
            />
          {/if}
        </div>
      </div>
    </div>
  </div>
  <PictureWall pictures={album.pictures} />
</div>
