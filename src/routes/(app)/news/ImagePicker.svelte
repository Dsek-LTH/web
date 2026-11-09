<script lang="ts">
  import { untrack } from "svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import ImagePlus from "@lucide/svelte/icons/image-plus";
  import Star from "@lucide/svelte/icons/star";
  import X from "@lucide/svelte/icons/x";
  import { isFileImage } from "$lib/files/utils";
  import { cn } from "$lib/utils";
  import * as m from "$paraglide/messages";

  type Tile = {
    key: string;
    kind: "existing" | "new";
    // Position in `existing` or `images`, depending on kind.
    index: number;
    src: string | undefined;
    name: string;
    isCover: boolean;
  };

  // No fallbacks on the bindable props: a fallback makes Svelte call the
  // parent's setter during init, which would write to the superforms store
  // while the form is still rendering. Missing values are handled below.
  let {
    existing: existingProp = $bindable(),
    images: imagesProp = $bindable(),
    coverUrl = $bindable(),
    coverNewIndex = $bindable(),
  }: {
    /** URLs of images that are already uploaded. */
    existing?: string[];
    /** Files picked in this session that have not been uploaded yet. */
    images?: File[];
    /** Cover when it is one of `existing`. */
    coverUrl?: string | null;
    /** Cover when it is one of `images`, as an index into `images`. */
    coverNewIndex?: number | null;
  } = $props();

  const existing = $derived(existingProp ?? []);
  const images = $derived(imagesProp ?? []);

  let inputElement: HTMLInputElement | undefined = $state();
  let isDraggingOver = $state(false);
  let notice = $state("");

  const fileKey = (file: File) =>
    `${file.name}:${file.size}:${file.lastModified}`;
  const imagesKey = $derived(images.map(fileKey).join("|"));

  // One object URL per file in `images`, in the same order. Depends on the file
  // set and not on the array identity, because superforms clones the form on
  // every write and the URLs would otherwise be recreated all the time.
  let previewUrls = $state.raw<string[]>([]);
  $effect(() => {
    const signature = imagesKey;
    const files = untrack(() => images);

    if (signature === "") {
      previewUrls = [];
      return;
    }

    const urls = files.map((file) => URL.createObjectURL(file));
    previewUrls = urls;

    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  });

  const cover = $derived.by(() => {
    if (coverNewIndex != null && coverNewIndex < images.length) {
      return { kind: "new", index: coverNewIndex } as const;
    }
    if (coverUrl != null && existing.includes(coverUrl)) {
      return { kind: "existing", index: existing.indexOf(coverUrl) } as const;
    }
    if (existing.length > 0) return { kind: "existing", index: 0 } as const;
    if (images.length > 0) return { kind: "new", index: 0 } as const;
    return null;
  });

  const nameFromUrl = (url: string) => url.split("/").pop() ?? url;

  const tiles: Tile[] = $derived([
    ...existing.map((url, index) => ({
      key: `existing:${url}`,
      kind: "existing" as const,
      index,
      src: url,
      name: nameFromUrl(url),
      isCover: cover?.kind === "existing" && cover.index === index,
    })),
    ...images.map((file, index) => ({
      key: `new:${fileKey(file)}`,
      kind: "new" as const,
      index,
      src: previewUrls[index],
      name: file.name,
      isCover: cover?.kind === "new" && cover.index === index,
    })),
  ]);

  function addFiles(files: Iterable<File>) {
    const seen = images.map(fileKey);
    const accepted: File[] = [];
    const messages: string[] = [];

    for (const file of files) {
      if (!isFileImage(file)) {
        messages.push(m.news_images_notImage({ name: file.name }));
      } else if (seen.includes(fileKey(file))) {
        messages.push(m.news_images_duplicate({ name: file.name }));
      } else {
        seen.push(fileKey(file));
        accepted.push(file);
      }
    }

    notice = messages.join(" ");
    // Assign a new array so the parent (and superforms) notices the change.
    if (accepted.length > 0) imagesProp = [...images, ...accepted];
  }

  function onInputChange(event: Event & { currentTarget: HTMLInputElement }) {
    addFiles(Array.from(event.currentTarget.files ?? []));
    // Without this, picking the same file again would not fire `change`.
    event.currentTarget.value = "";
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    isDraggingOver = false;
    addFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  function makeCover(tile: Tile) {
    if (tile.kind === "existing") {
      const url = existing[tile.index];
      if (url === undefined) return;
      coverUrl = url;
      coverNewIndex = null;
    } else {
      coverNewIndex = tile.index;
      coverUrl = null;
    }
  }

  function remove(tile: Tile) {
    if (tile.kind === "existing") {
      const removedUrl = existing[tile.index];
      existingProp = existing.filter((_, i) => i !== tile.index);
      if (coverUrl === removedUrl) coverUrl = null;
      return;
    }

    imagesProp = images.filter((_, i) => i !== tile.index);
    if (coverNewIndex === tile.index) {
      coverNewIndex = null;
    } else if (coverNewIndex != null && coverNewIndex > tile.index) {
      // Everything after the removed file moved one step down.
      coverNewIndex -= 1;
    }
  }
</script>

<div class="flex w-full flex-col gap-3">
  <input
    bind:this={inputElement}
    type="file"
    accept="image/*"
    multiple
    class="hidden"
    onchange={onInputChange}
  />

  <div
    role="group"
    aria-label={m.news_images()}
    class={cn(
      "bg-secondary-background border-border flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed p-4",
      isDraggingOver && "border-primary",
    )}
    ondragover={(event) => {
      event.preventDefault();
      isDraggingOver = true;
    }}
    ondragleave={() => (isDraggingOver = false)}
    ondrop={onDrop}
  >
    <p class="text-muted-foreground min-w-0 text-sm">{m.news_images_drop()}</p>
    <Button
      type="button"
      variant="outline"
      onclick={() => inputElement?.click()}
    >
      <ImagePlus />{m.news_images_add()}
    </Button>
  </div>

  <p class="text-destructive min-h-5 text-sm" role="status" aria-live="polite">
    {notice}
  </p>

  {#if tiles.length === 0}
    <p
      class="text-muted-foreground border-border rounded-md border p-4 text-center text-sm"
    >
      {m.news_images_empty()}
    </p>
  {:else}
    <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 ml-0">
      {#each tiles as tile (tile.key)}
        <li
          class={cn(
            "border-border bg-background relative aspect-[4/3] min-w-0 overflow-hidden rounded-md border",
            tile.isCover && "border-primary ring-primary ring-1",
          )}
        >
          <div class="bg-muted-background relative size-full">
            {#if tile.src}
              <img
                class="size-full object-cover"
                title={tile.name}
                src={tile.src}
                alt={tile.name}
              />
            {/if}
            {#if tile.isCover}
              <span
                class="bg-primary text-primary-foreground absolute top-1.5 left-1.5 rounded px-1.5 py-0.5 text-xs font-semibold"
              >
                {m.news_images_cover()}
              </span>
            {/if}
            <div class="absolute top-1.5 right-1.5 flex gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                class="bg-background"
                title={tile.isCover
                  ? m.news_images_cover()
                  : m.news_images_makeCover()}
                aria-label={tile.isCover
                  ? m.news_images_cover()
                  : m.news_images_makeCover()}
                disabled={tile.isCover}
                onclick={() => makeCover(tile)}
              >
                <Star class={cn(tile.isCover && "fill-current")} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                class="bg-background"
                title={m.news_images_remove({ name: tile.name })}
                aria-label={m.news_images_remove({ name: tile.name })}
                onclick={() => remove(tile)}
              >
                <X />
              </Button>
            </div>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>
