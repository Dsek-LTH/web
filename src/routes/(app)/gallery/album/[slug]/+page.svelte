<script lang="ts">
  import * as m from "$paraglide/messages";

  import type { PageProps } from "./$types";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  let { data }: PageProps = $props();

  let pictureModal: HTMLDialogElement = $state();
  let selectedModalPicture = $state(0);
  $effect(() => {
    if (selectedModalPicture < 0) {
      selectedModalPicture = 0;
    }
    if (selectedModalPicture > pictures.length - 1) {
      selectedModalPicture = pictures.length - 1;
    }
    selectedModalUrl = pictures[selectedModalPicture].thumbnailUrl;
  });
  let selectedModalUrl = $state();

  let pictures = data.pictures;

  let modalPrev: HTMLButtonElement = $state();
  let modalNext: HTMLButtonElement = $state();

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

  /*$: meetings = Object.keys(data.meetings).sort((a, b) =>
    type === "board-meeting" || type === "SRD-meeting"
      ? b.localeCompare(a, "sv")
      : a.localeCompare(b, "sv"),
  );
  $: canCreate = isAuthorized(
    apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).CREATE,
    data.user,
  );
  $: canEdit = isAuthorized(
    apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).DELETE,
    data.user,
  );*/

  let canEdit,
    canCreate = true;
</script>

<svelte:window on:keydown={onKeyDown} />

<SetPageTitle title={m.documents()} />

<div class="flex flex-row flex-wrap justify-between">
  {#if canCreate || canEdit}
    <div class="mb-4 flex flex-row gap-1">
      {#if canCreate}
        <a class="btn btn-primary btn-sm" href="/documents/upload"
          >{m.documents_uploadFile()}</a
        >
      {/if}
      {#if canEdit}
        <button
          class="btn btn-secondary btn-sm"
          onclick={() => {
            isEditing = !isEditing;
          }}
        >
          {isEditing ? m.documents_stopEditing() : m.documents_edit()}
        </button>
      {/if}
    </div>
  {/if}
</div>
<a href="/gallery" class="btn">Tillbaka</a>
<div class="flex gap-4 flex-wrap bg-base-300 p-7 rounded-xl">
  {#each pictures as picture, index (picture)}
    <a
      onclick={() => {
        pictureModal.showModal();
        selectedModalPicture = index;
      }}
      href="#he"
      ><img
        class="block max-h-[15rem] relative"
        src={picture.thumbnailUrl}
        alt="display"
      />
    </a>

    <!--<Album
      name={album}
      files={data.albums[album] ?? []}
      {isEditing}
      deleteForm={data.deleteForm}
    />-->
  {/each}
  <dialog bind:this={pictureModal} class="modal">
    <div class="max-w-[50vw] modal-box">
      <img src={selectedModalUrl} class="max-h-[70vh]" alt="display" />
      <button bind:this={modalPrev} class="btn" onclick={selectedModalPicture--}
        >prev</button
      >
      <button bind:this={modalNext} class="btn" onclick={selectedModalPicture++}
        >next</button
      >
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</div>
