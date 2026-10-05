<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from "$lib/components/ui/button";
  import { MoveLeft, MoveRight } from "@lucide/svelte";
  import { onMount } from "svelte";
  import type { FileData } from "$lib/files/fileHandler";

  let { pictures }: { pictures: FileData[] } = $props();

  let modalPrev: HTMLButtonElement | null = $state(null);
  let modalNext: HTMLButtonElement | null = $state(null);

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

  onMount(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowLeft":
          modalPrev?.click();
          break;
        case "ArrowRight":
          modalNext?.click();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });
</script>

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
