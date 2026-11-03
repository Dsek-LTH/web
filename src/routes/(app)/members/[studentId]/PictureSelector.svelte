<script lang="ts">
  import type { PageData } from "./$types";
  import type { PageData as EditPageData } from "./edit/$types";
  import { cn } from "$lib/utils";
  import CloudUpload from "@lucide/svelte/icons/cloud-upload";
  import Cropper from "svelte-easy-crop";
  import * as m from "$paraglide/messages";
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import * as ButtonGroup from "$lib/components/ui/button-group";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";
  import Trash from "@lucide/svelte/icons/trash";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import { api, multipart } from "$lib/api/client";
  import { invalidateAll } from "$app/navigation";
  import { toast } from "$lib/stores/toast";

  // Pure-proxy mutations (DESIGN.md's principle #5): the picture is
  // cropped and scaled here in the browser, then uploaded straight to Go,
  // which stores it and makes it the member's avatar.
  let { data }: { data: PageData | EditPageData } = $props();

  let member = $derived(data.viewedMember);

  const MAX_SIZE = 8_000_000;
  const OUTPUT_SIDE = 400;

  let image: ImageBitmap | undefined = $state(undefined);
  let avatar: string | undefined = $state(undefined);
  let crop = { x: 0, y: 0, width: 0, height: 0 };
  let uploadError: string | undefined = $state(undefined);
  let uploading = $state(false);
  let deleteOpen = $state(false);

  const onFileSelected = async (
    event: Event & { currentTarget: EventTarget & HTMLInputElement },
  ) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    uploadError = undefined;
    if (file.size >= MAX_SIZE) {
      uploadError = m.members_errors_tooLargePicture({ size: "8MB" });
      return;
    }
    try {
      image = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      uploadError = m.members_errors_invalidPicture();
      return;
    }
    avatar = imageBitmapToDataURL(image);
  };

  const imageBitmapToDataURL = (img: ImageBitmap) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d")?.drawImage(img, 0, 0);
    return canvas.toDataURL();
  };

  // The cropped area, scaled down to at most 400x400, as WebP.
  const croppedPicture = (img: ImageBitmap) =>
    new Promise<Blob>((resolve, reject) => {
      const side = Math.min(OUTPUT_SIDE, crop.width, crop.height);
      const canvas = document.createElement("canvas");
      canvas.width = side;
      canvas.height = side;
      canvas
        .getContext("2d")
        ?.drawImage(
          img,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          side,
          side,
        );
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
        "image/webp",
        0.9,
      );
    });

  const cancel = () => {
    image?.close();
    image = undefined;
    avatar = undefined;
    uploadError = undefined;
  };

  const upload = async (event: SubmitEvent) => {
    event.preventDefault();
    if (!image || !member.studentId) return;
    uploading = true;
    try {
      const picture = new File([await croppedPicture(image)], "picture.webp", {
        type: "image/webp",
      });
      const res = await api.PUT("/members/{studentId}/picture", {
        params: { path: { studentId: member.studentId } },
        body: { image: picture },
        ...multipart,
      });
      if (res.error) {
        uploadError = `${m.members_errors_couldntUploadFile()}: ${res.error.detail ?? res.response.statusText}`;
        return;
      }
      cancel();
      toast(m.members_pictureUploaded(), "success");
      await invalidateAll();
    } catch (e) {
      uploadError = `${m.members_errors_couldntUploadFile()}: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      uploading = false;
    }
  };

  const removePicture = async () => {
    if (!member.studentId) return;
    const res = await api.DELETE("/members/{studentId}/picture", {
      params: { path: { studentId: member.studentId } },
    });
    deleteOpen = false;
    if (res.error) {
      toast(res.error.detail ?? "Failed to remove picture", "error");
      return;
    }
    toast(m.members_pictureRemoved(), "success");
    await invalidateAll();
  };
</script>

<div
  class="relative {avatar
    ? 'flex flex-col items-center gap-2 rounded-md border-[1px] p-4'
    : ''}"
>
  <MemberAvatar {member} class="relative size-24" />
  <form id="upload" class="flex flex-col items-center gap-2" onsubmit={upload}>
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
          accept="image/*"
          onchange={onFileSelected}
        /></label
      >
      {#if member?.picturePath}
        <AlertDialog.Root bind:open={deleteOpen}>
          <AlertDialog.Trigger
            class={buttonVariants({ variant: "outline", size: "icon-sm" })}
          >
            <Trash />
          </AlertDialog.Trigger>
          <AlertDialog.Content class="z-[500]">
            <form
              id="deletion"
              onsubmit={(e) => {
                e.preventDefault();
                removePicture();
              }}
            >
              <AlertDialog.Header>
                <AlertDialog.Title
                  >{m.member_removePicture_title()}</AlertDialog.Title
                >
                <AlertDialog.Description>
                  {m.member_removePicture_desc()}
                </AlertDialog.Description>
              </AlertDialog.Header>
              <AlertDialog.Footer>
                <AlertDialog.Cancel type="button"
                  >{m.cancel()}</AlertDialog.Cancel
                >
                <AlertDialog.Action>{m.delete_delete()}</AlertDialog.Action>
              </AlertDialog.Footer>
            </form>
          </AlertDialog.Content>
        </AlertDialog.Root>
      {/if}
    </ButtonGroup.Root>

    {#if avatar}
      <div class="relative size-80">
        <Cropper
          aspect={1 / 1}
          cropShape="round"
          showGrid={false}
          image={avatar}
          on:cropcomplete={(e) => {
            crop = e.detail.pixels;
          }}
        />
      </div>

      <div class="flex flex-row gap-2">
        <Button type="button" variant="outline" onclick={cancel}
          >{m.cancel()}</Button
        >
        <Button type="submit" variant="rosa" disabled={uploading}>
          {m.members_save()}
        </Button>
      </div>
    {/if}
    {#if uploadError}
      <p class="text-rosa-500 mt-1 text-xs font-semibold">
        <CircleAlert class="mb-[2px] inline h-[1rem] w-[1rem]" />
        {uploadError}
      </p>
    {/if}
  </form>
</div>
