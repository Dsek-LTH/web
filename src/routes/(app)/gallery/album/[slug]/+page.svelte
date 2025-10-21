<script lang="ts">
  import * as m from "$paraglide/messages";
  import type { PageProps } from "./$types";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";

  let { data }: PageProps = $props();

  const albumName = data.album.split(/ (.*)/s)[1];
  const albumDate = data.album.split(" ")[0];

  let pictureModal: HTMLDialogElement | undefined = $state();
  let selectedModalPicture = $state(0);
  $effect(() => {
    if (selectedModalPicture < 0) {
      selectedModalPicture = 0;
    }
    if (selectedModalPicture > pictures.length - 1) {
      selectedModalPicture = pictures.length - 1;
    }
    selectedModalUrl = pictures[selectedModalPicture]?.thumbnailUrl;
  });
  let selectedModalUrl: string | undefined = $state();

  let pictures = data.pictures;

  let modalPrev: HTMLButtonElement | undefined = $state();
  let modalNext: HTMLButtonElement | undefined = $state();

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

<SetPageTitle title={m.gallery_album() + " - " + albumName} />

<a href="/gallery" class="btn btn-outline btn-sm m-2">{m.gallery_back()}</a>
<div class="rounded-xl bg-base-300 p-7">
  <div class="flex flex-col">
    <div class="flex flex-row items-center justify-between p-3">
      <h1 class="text-2xl font-bold">{albumName}</h1>
      <span class="">{albumDate}</span>
    </div>
    <div class="flex flex-col px-3">
      {#if data.metadata}
        <p>{m.gallery_photographer() + ": " + data.metadata.photographer}</p>
        <p>{m.gallery_editor() + ": " + data.metadata.editor}</p>
      {/if}
    </div>
  </div>
  <!--flex flex-col items-center gap-4 md:flex-row md:flex-wrap-->
  <div
    class="flex flex-col items-center gap-4 sm:block sm:columns-2 md:columns-3"
  >
    {#each pictures as picture, index (picture)}
      <button
        type="button"
        onclick={() => {
          selectedModalPicture = index;
          pictureModal?.showModal();
        }}
        class="block text-left leading-[unset]"
        ><img
          class="relative my-4 block object-contain"
          src={picture.thumbnailUrl}
          alt="display"
        />
      </button>
    {/each}
  </div>
  <dialog bind:this={pictureModal} class="modal">
    <div class="modal-box flex max-w-[50vw] flex-col justify-center">
      <img
        src={selectedModalUrl}
        class="max-h-[70vh] object-contain"
        alt="display"
      />
      <div class="m-1 flex flex-row items-center justify-center">
        <button
          bind:this={modalPrev}
          class="btn"
          onclick={() => selectedModalPicture--}
          ><span class="i-mdi-arrow-left"></span>{m.gallery_previous()}</button
        >
        <button
          bind:this={modalNext}
          class="btn"
          onclick={() => selectedModalPicture++}
          ><span class="i-mdi-arrow-right"></span>{m.gallery_next()}</button
        >
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</div>
