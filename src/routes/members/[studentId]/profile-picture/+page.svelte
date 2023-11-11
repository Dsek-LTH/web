<script lang="ts">
  import { enhance } from "$app/forms";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/member";
  import ProfileImage from "./ProfileImage.svelte";
  import Cropper from "svelte-easy-crop";

  export let data;
  export let form;
  $: member = data.member;
  $: photos = data.photos;
  let isEditing = false;

  let crop = { x: 0, y: 0, width: 0, height: 0 };

  let avatar: string | undefined = undefined;
  let fileinput;
  const onFileSelected = (
    event: Event & {
      currentTarget: EventTarget & HTMLInputElement;
    }
  ) => {
    let image = event.currentTarget.files?.[0];
    if (!image) return;
    let reader = new FileReader();
    reader.readAsDataURL(image);
    reader.onload = (e) => {
      let result = e.target?.result ?? undefined;
      // If array buffer, convert to base64
      if (result instanceof ArrayBuffer) {
        avatar = btoa(
          new Uint8Array(result).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );
      } else {
        avatar = result;
      }
    };
  };
</script>

<svelte:head>
  <title>Bio - {getFullName(member)} | D-sektionen</title>
</svelte:head>
<header class="flex gap-4">
  <MemberAvatar {member} class="w-32 rounded-lg" />
  <div class="flex flex-col">
    <h1 class="text-3xl font-bold">{getFullName(member)}</h1>
    {member.studentId}
  </div>
</header>
<div class="mt-4 flex flex-wrap items-start gap-4">
  {#if !isEditing}
    <button
      class="btn btn-primary btn-lg"
      on:click={() => {
        isEditing = true;
      }}
    >
      Ladda upp ny
    </button>
  {:else}
    <form
      method="POST"
      action="?/upload"
      class="form-control gap-2"
      use:enhance={() =>
        async ({ update, result }) => {
          await update();
          if (result.type === "success") {
            isEditing = false;
            avatar = undefined;
            crop = { x: 0, y: 0, width: 0, height: 0 };
          }
        }}
    >
      {#if avatar}
        <div class="relative h-[400px] w-[400px]">
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
      {/if}
      <input type="hidden" name="crop-x" value={crop.x} />
      <input type="hidden" name="crop-y" value={crop.y} />
      <input type="hidden" name="crop-width" value={crop.width} />
      <input type="hidden" name="crop-height" value={crop.height} />
      <input
        on:change={(e) => onFileSelected(e)}
        bind:this={fileinput}
        type="file"
        accept="image/*"
        name="image"
        class="file-input file-input-bordered w-full max-w-xs"
      />
      {#if form?.success}
        <p class="text-success">Uppladdad</p>
      {:else if form?.error}
        <p class="text-error">{form.error}</p>
      {/if}
      <button type="submit" class="btn btn-primary" on:click={() => {}}> Spara </button>
    </form>
  {/if}
  {#each photos as photo (photo.id)}
    {#if photo.thumbnailUrl}
      <div class="relative">
        <ProfileImage
          url={photo.thumbnailUrl}
          current={member.picturePath === photo.thumbnailUrl}
        />

        <form method="POST" action="?/delete" use:enhance>
          <input type="hidden" value={photo.name} name="fileName" />
          <button class="btn btn-square btn-secondary btn-sm absolute bottom-1 right-1">
            <span class="i-mdi-delete" />
          </button>
        </form>
      </div>
    {/if}
  {/each}
</div>
