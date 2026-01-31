<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar";
  import type { PageData } from "./$types";
  import type { PageData as EditPageData } from "./edit/$types";
  import { getInitials } from "$lib/utils/client/member";
  import { cn } from "$lib/utils";
  import CloudUpload from "@lucide/svelte/icons/cloud-upload";
  import { fileProxy } from "sveltekit-superforms/client";
  import { superForm } from "$lib/utils/client/superForms";
  import Cropper from "svelte-easy-crop";
  import * as m from "$paraglide/messages";
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import * as ButtonGroup from "$lib/components/ui/button-group";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";
  import Trash from "@lucide/svelte/icons/trash";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { enhance as svEnhance } from "$app/forms";

  let { data }: { data: PageData | EditPageData } = $props();

  let member = $derived(data.member);

  let avatar: string | undefined = $state(undefined);

  let crop = { x: 0, y: 0, width: 0, height: 0 };
  const { form, errors } = $derived(
    superForm(data.uploadForm, {
      //resetForm: true,
      onResult(event) {
        if (event.result.type === "success") {
          //avatar = undefined;
        }
      },
      //validators: zodClient(uploadSchema),
    }),
  );
  const file = $derived(fileProxy(form, "image"));

  const onFileSelected = (
    event: Event & {
      currentTarget: EventTarget & HTMLInputElement;
    },
  ) => {
    let image = event.currentTarget.files?.[0];
    if (!image) return;
    createImageBitmap(image).then((imageBitmap) => {
      avatar = imageBitmapToDataURL(imageBitmap);
    });
  };

  const imageBitmapToDataURL = (img: ImageBitmap) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = img.width;
    canvas.height = img.height;

    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL();
  };

  let deleteOpen = $state(false);
</script>

<div
  class="relative {avatar
    ? 'flex flex-col items-center gap-2 rounded-md border-[1px] p-4'
    : ''}"
>
  <Avatar.Root class="relative size-24">
    <Avatar.Image src={member?.picturePath ?? ""} alt="Member image" />
    <Avatar.Fallback>{getInitials(member)}</Avatar.Fallback>
  </Avatar.Root>
  <form
    id="upload"
    method="POST"
    action="?/uploadPicture"
    class="flex flex-col items-center gap-2"
    enctype="multipart/form-data"
    use:svEnhance
  >
    <ButtonGroup.Root
      class="{avatar ? 'hidden' : ''} absolute right-0 bottom-0 size-8"
    >
      <label
        class={cn(
          "size-8",
          "bg-secondary-background text-secondary-foreground hover:bg-secondary-hover dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border shadow-xs",
          "focus-visible:border-ring focus-visible:ring-ring/50 inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        )}
        ><CloudUpload /><input
          type="file"
          class="hidden"
          name="image"
          bind:files={$file}
          onchange={(e) => onFileSelected(e)}
        /></label
      >
      {#if !member?.picturePath}
        <AlertDialog.Root bind:open={deleteOpen}>
          <AlertDialog.Trigger
            class={buttonVariants({ variant: "outline", size: "icon-sm" })}
          >
            <Trash />
          </AlertDialog.Trigger>
          <AlertDialog.Content class="z-[400]">
            <form
              method="POST"
              action="?/deletePicture"
              id="deletion"
              onsubmit={() => {
                return new Promise((resolve) => setTimeout(resolve, 500)).then(
                  () => (deleteOpen = false),
                );
              }}
              use:svEnhance
            >
              <AlertDialog.Header>
                <AlertDialog.Title
                  >form submission tar sönder dialogen</AlertDialog.Title
                >
                <AlertDialog.Description>
                  This action cannot be undone. This will permanently delete
                  your account and remove your data from our servers.
                </AlertDialog.Description>
              </AlertDialog.Header>
              <AlertDialog.Footer>
                <AlertDialog.Cancel type="button">Cancel</AlertDialog.Cancel>
                <AlertDialog.Action>Continue</AlertDialog.Action>
              </AlertDialog.Footer>
            </form>
          </AlertDialog.Content>
        </AlertDialog.Root>
      {/if}
    </ButtonGroup.Root>

    <input type="hidden" name="cropX" bind:value={$form.cropX} />
    <input type="hidden" name="cropY" bind:value={$form.cropY} />
    <input type="hidden" name="cropWidth" bind:value={$form.cropWidth} />
    <input type="hidden" name="cropHeight" bind:value={$form.cropHeight} />
    {#if $errors.cropX}
      <p class="text-error">{$errors.cropX}</p>
    {/if}
    {#if $errors.cropY}
      <p class="text-error">{$errors.cropY}</p>
    {/if}
    {#if $errors.cropWidth}
      <p class="text-error">{$errors.cropWidth}</p>
    {/if}
    {#if $errors.cropHeight}
      <p class="text-error">{$errors.cropHeight}</p>
    {/if}

    {#if avatar}
      <div class="relative size-80">
        <Cropper
          aspect={1 / 1}
          cropShape="round"
          showGrid={false}
          image={avatar}
          on:cropcomplete={(e) => {
            crop = e.detail.pixels;
            form.update((f) => {
              f.cropX = crop.x;
              f.cropY = crop.y;
              f.cropWidth = crop.width;
              f.cropHeight = crop.height;
              return f;
            });
          }}
        />
      </div>
      {#if $errors.image}
        <p class="text-rosa-500 mt-1 text-xs font-semibold">
          <CircleAlert class="mb-[2px] inline h-[1rem] w-[1rem]" />
          {$errors.image}
        </p>
      {/if}

      <div class="flex flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          onclick={() => (avatar = undefined)}>{m.cancel()}</Button
        >
        <Button type="submit" variant="rosa">
          {m.members_save()}
        </Button>
      </div>
    {/if}
  </form>
</div>
