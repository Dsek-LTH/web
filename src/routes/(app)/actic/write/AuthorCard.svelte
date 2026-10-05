<script lang="ts">
  import { Input } from "$lib/components/ui/input/index.js";
  import { FIELD_BG } from "$lib/actic/fieldStyles";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import MemberNameInput from "$lib/actic/MemberNameInput.svelte";
  import PositionInput from "$lib/actic/PositionInput.svelte";
  import { attachAction } from "$lib/actic/attachAction";
  import type { AuthorInput } from "$lib/actic/dsek";
  import {
    addSignature,
    getSignaturePreview,
    isAllowedSignature,
    removeSignature,
  } from "$lib/actic/signatures";
  import * as m from "$paraglide/messages";
  import GripVertical from "@lucide/svelte/icons/grip-vertical";
  import X from "@lucide/svelte/icons/x";
  import ImageUp from "@lucide/svelte/icons/image-up";

  let {
    author,
    index,
    handle,
    onremove,
  }: {
    // Mutated in place by the inputs below (it is a `$state` object owned by the
    // parent), so no `$bindable` is needed.
    author: AuthorInput;
    index: number;
    /** dnd-kit attachment for the drag handle. */
    handle: (node: HTMLElement) => () => void;
    onremove: () => void;
  } = $props();

  let fileInput: HTMLInputElement | undefined = $state();
  let dropActive = $state(false);
  let signatureError = $state("");
  let nameTouched = $state(false);
  let nameError = $derived(
    nameTouched && !author.name.trim() ? m.actic_author_name_required() : "",
  );

  async function handleFile(file: File | undefined) {
    signatureError = "";
    if (!file) return;
    if (!isAllowedSignature(file)) {
      signatureError = m.actic_author_signature_error();
      return;
    }
    if (author.signature) removeSignature(author.signature.path);
    author.signature = { path: await addSignature(file) };
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    dropActive = false;
    void handleFile(event.dataTransfer?.files?.[0]);
  }

  function removeSig() {
    if (author.signature) removeSignature(author.signature.path);
    author.signature = undefined;
  }
</script>

<div
  class="border-border bg-background flex flex-col gap-2 rounded-md border p-2"
>
  <div class="flex items-center justify-between">
    <span
      use:attachAction={handle}
      class="text-muted-foreground flex cursor-grab items-center gap-1 text-xs"
      role="button"
      tabindex="0"
      aria-label={m.actic_author_drag()}
      title={m.actic_author_drag()}
    >
      <GripVertical class="h-4 w-4" />
      {index + 1}
    </span>
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={m.actic_author_remove()}
      onclick={onremove}
    >
      <X class="h-4 w-4" />
    </Button>
  </div>

  <div class="flex flex-col gap-1">
    <Label for={`author-message-${index}`} class="text-xs"
      >{m.actic_author_message()}</Label
    >
    <Input
      id={`author-message-${index}`}
      class={FIELD_BG}
      bind:value={author.message}
      placeholder={m.actic_author_message_placeholder()}
    />
  </div>

  <div class="flex flex-col gap-1">
    <Label class="text-xs">{m.actic_author_signature()}</Label>
    {#if author.signature}
      <div class="relative w-fit">
        <img
          src={getSignaturePreview(author.signature.path)}
          alt=""
          class="border-border max-h-14 rounded border bg-white p-1"
        />
        <button
          type="button"
          class="bg-background border-border absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border shadow-sm"
          aria-label={m.actic_author_signature_remove()}
          onclick={removeSig}
        >
          <X class="h-3 w-3" />
        </button>
      </div>
    {:else}
      <button
        type="button"
        class="text-muted-foreground flex min-h-16 flex-col items-center justify-center gap-1 rounded border border-dashed px-2 py-3 text-xs"
        class:border-primary={dropActive}
        onclick={() => fileInput?.click()}
        ondragover={(e) => {
          e.preventDefault();
          dropActive = true;
        }}
        ondragleave={() => (dropActive = false)}
        ondrop={onDrop}
      >
        <ImageUp class="h-4 w-4" />
        {m.actic_author_signature_add()}
      </button>
      <input
        bind:this={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        class="hidden"
        onchange={(e) => {
          const input = e.currentTarget;
          void handleFile(input.files?.[0]);
          input.value = "";
        }}
      />
    {/if}
    {#if signatureError}
      <p class="text-destructive text-xs">{signatureError}</p>
    {/if}
  </div>

  <div class="flex flex-col gap-1">
    <Label for={`author-name-${index}`} class="text-xs"
      >{m.actic_author_name()}
      <span class="text-destructive">*</span></Label
    >
    <MemberNameInput
      id={`author-name-${index}`}
      bind:value={author.name}
      placeholder={m.actic_author_name_placeholder()}
      invalid={!!nameError}
      errorMessage={nameError}
      onblur={() => (nameTouched = true)}
    />
  </div>

  <div class="flex flex-col gap-1">
    <Label for={`author-position-${index}`} class="text-xs"
      >{m.actic_author_position()}</Label
    >
    <PositionInput
      id={`author-position-${index}`}
      bind:position={author.position}
      placeholder={m.actic_author_position_placeholder()}
    />
  </div>
</div>
