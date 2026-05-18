<script lang="ts">
  import * as m from "$paraglide/messages";
  import type { PageProps } from "./$types";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import MemberCard from "$lib/components/MemberCard.svelte";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from "$lib/components/ui/button";
  import { MoveLeft, MoveRight } from "@lucide/svelte";

  let { data }: PageProps = $props();

  let selectedModalPicture = $state(0);
  $effect(() => {
    if (selectedModalPicture < 0) {
      selectedModalPicture = 0;
    }
    if (selectedModalPicture > pictures.length - 1 && pictures.length > 0) {
      selectedModalPicture = pictures.length - 1;
    }
    selectedModalUrl = pictures[selectedModalPicture]?.thumbnailUrl;
  });
  let selectedModalUrl: string | undefined = $state();

  let pictures = $derived(data.pictures);

  let modalPrev: HTMLButtonElement | null = $state(null);
  let modalNext: HTMLButtonElement | null = $state(null);

  function onKeyDown(e: { key: string }) {
    switch (e.key) {
      case "ArrowLeft":
        modalPrev?.click();
        break;
      case "ArrowRight":
        modalNext?.click();
        break;
    }
  }
</script>

<svelte:window on:keydown={onKeyDown} />

<SetPageTitle title={m.gallery_album() + " - " + data.album?.title} />

<div class="layout-container">
  <a href="/gallery" class="btn btn-outline btn-sm m-2">{m.gallery_back()}</a>
  <div class="bg-base-300 rounded-xl p-7">
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
          <h2 class="text-lg font-semibold">
            {data.album.photographers.length > 1
              ? m.gallery_photographers()
              : m.gallery_photographer()}
          </h2>
          <div class="flex flex-row flex-wrap items-center gap-2">
            {#each data.album?.photographers as p (p.studentId)}
              <MemberCard member={p} />
            {/each}
          </div>
        {/if}
        {#if data.album?.editors}
          <h2 class="text-lg font-semibold">
            {data.album.editors.length > 1
              ? m.gallery_editors()
              : m.gallery_editor()}
          </h2>
          <div class="flex flex-row flex-wrap items-center gap-2">
            {#each data.album?.editors as p (p.studentId)}
              <MemberCard member={p} />
            {/each}
          </div>
        {/if}
      </div>
    </div>
    <Dialog.Root>
      <div
        class="flex flex-col items-center gap-4 sm:block sm:columns-2 md:columns-3"
      >
        {#each pictures as picture, index (picture)}
          <Dialog.Trigger
            type="button"
            onclick={() => {
              selectedModalPicture = index;
            }}
            class="block text-left leading-[unset]"
            ><img
              class="relative my-2 block object-contain"
              src={picture.thumbnailUrl}
              alt="display"
            />
          </Dialog.Trigger>
        {/each}
      </div>
      <Dialog.Content class="w-fit !max-w-[90vw]">
        <div class="flex flex-col items-center justify-center">
          <img
            src={selectedModalUrl}
            class="h-fill w-fill relative block max-h-[calc(90vh-50px)] max-w-[90vw] rounded-lg object-contain p-3"
            alt="display"
          />
          <div class="m-2 -mt-1 flex flex-row items-center justify-center">
            <Button
              bind:ref={modalPrev}
              type="button"
              variant="ghost"
              class="btn"
              onclick={() => selectedModalPicture--}><MoveLeft /></Button
            >
            <Button
              bind:ref={modalNext}
              type="button"
              variant="ghost"
              class="btn"
              onclick={() => selectedModalPicture++}><MoveRight /></Button
            >
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  </div>
</div>
