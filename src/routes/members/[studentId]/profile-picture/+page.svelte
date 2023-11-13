<script lang="ts">
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/member";
  import { page } from "$app/stores";
  import { superForm } from "sveltekit-superforms/client";
  import ProfileImage from "./ProfileImage.svelte";
  import Cropper from "svelte-easy-crop";

  export let data;
  $: member = data.member;
  $: photos = data.photos;
  let isEditing = false;

  let crop = { x: 0, y: 0, width: 0, height: 0 };
  const { form, errors, enhance } = superForm(data.uploadForm, {
    resetForm: true,
    onResult(event) {
      if (event.result.type === "success") {
        avatar = undefined;
        isEditing = false;
      }
    },
  });

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
  <title>Bio - {getFullName($page.data.session?.user, member)} | D-sektionen</title>
</svelte:head>
<header class="flex gap-4">
  <MemberAvatar {member} class="w-32 rounded-lg" />
  <div class="flex flex-col">
    <h1 class="text-3xl font-bold">{getFullName($page.data.session?.user, member)}</h1>
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
      use:enhance
      enctype="multipart/form-data"
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
      {/if}
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
      <input
        on:change={(e) => onFileSelected(e)}
        bind:this={fileinput}
        type="file"
        accept="image/*"
        name="image"
        class="file-input file-input-bordered w-full max-w-xs"
      />
      {#if $errors.image}
        <p class="text-error">{$errors.image}</p>
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
          fileName={photo.name}
          changeForm={data.changeForm}
          deleteForm={data.deleteForm}
        />
      </div>
    {/if}
  {/each}
</div>
