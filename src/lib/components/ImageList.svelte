<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";

  let { images }: { images: string[] } = $props();
</script>

{#if images.length > 0}
  <div
    data-sveltekit-preload-data="off"
    class="bg-muted-background border-border mt-2 flex h-40 w-full flex-row overflow-scroll rounded-md border-[1px] p-2"
  >
    {#each images as image (image)}
      <Dialog.Root>
        <Dialog.Trigger
          class="mx-1 block h-full min-h-full shrink-0 cursor-pointer "
          ><img
            class="relative block h-full object-contain"
            src={image}
            alt={image}
          /></Dialog.Trigger
        >
        <Dialog.Content class="sm:max-w-[625px]">
          <Dialog.Header>
            <Dialog.Title class="p-1"></Dialog.Title>
            <Dialog.Description>
              <img class="m-4 mx-auto" src={image} alt={image} />
            </Dialog.Description>
          </Dialog.Header>
        </Dialog.Content>
      </Dialog.Root>
    {/each}
  </div>
{/if}
