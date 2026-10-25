<script lang="ts">
  import { DragDropProvider } from "@dnd-kit/svelte";
  import { move } from "@dnd-kit/helpers";
  import { Label } from "$lib/components/ui/label/index.js";
  import AuthorCard from "$lib/actic/AuthorCard.svelte";
  import SortableItem from "$lib/actic/SortableItem.svelte";
  import { nextId, type AuthorRow } from "$lib/actic/fields";
  import * as m from "$paraglide/messages";
  import Plus from "@lucide/svelte/icons/plus";

  let {
    authors = $bindable([] as AuthorRow[]),
    error = "",
    ontouch,
  }: {
    authors?: AuthorRow[];
    error?: string;
    /** Called when a field loses focus, so the parent can mark the section touched. */
    ontouch?: () => void;
  } = $props();

  let snapshot = $state<AuthorRow[]>([]);

  function emptyAuthor(): AuthorRow {
    return { id: nextId("author"), name: "" };
  }
  function add() {
    authors = [...authors, emptyAuthor()];
  }
  function remove(i: number) {
    authors = authors.filter((_, idx) => idx !== i);
    if (authors.length === 0) authors = [emptyAuthor()];
  }
</script>

<div class="flex flex-col gap-2">
  <Label>{m.actic_field_authors()}</Label>
  <DragDropProvider
    onDragStart={() => (snapshot = authors)}
    onDragOver={(event) => (authors = move(authors, event))}
    onDragEnd={(event) => {
      if (event.canceled) authors = snapshot;
    }}
  >
    <div
      class="grid auto-rows-fr grid-cols-1 gap-3 {authors.length <= 1
        ? 'sm:grid-cols-2'
        : 'sm:grid-cols-2 xl:grid-cols-3'}"
      onfocusout={ontouch}
    >
      {#each authors as author, i (author.id)}
        <SortableItem id={author.id} index={i} group="authors">
          {#snippet children({ handle })}
            <AuthorCard
              author={authors[i]!}
              index={i}
              {handle}
              removeDisabled={authors.length === 1}
              onremove={() => remove(i)}
            />
          {/snippet}
        </SortableItem>
      {/each}
      <!-- The add button as a dotted outline, occupying the next author's
           place in the grid (same height, since rows stretch). -->
      <button
        type="button"
        class="border-border text-muted-foreground hover:border-foreground hover:text-foreground flex min-h-64 items-center justify-center rounded-md border border-dashed"
        aria-label={m.actic_author_add()}
        onclick={add}
      >
        <Plus class="h-5 w-5" />
      </button>
    </div>
  </DragDropProvider>
  {#if error}
    <p class="text-destructive text-xs">{error}</p>
  {/if}
</div>
