<script lang="ts">
  import type { ArticleTagSummary } from "$lib/news/types";
  import TagChip from "./TagChip.svelte";
  import { twMerge } from "tailwind-merge";

  let {
    tags,
    class: klass,
    chipClass,
    plusClass,
    minVisible = 0,
  }: {
    tags: ArticleTagSummary[];
    /** Classes for the row itself; it must have a definite width to fit into. */
    class?: string;
    chipClass?: string;
    plusClass?: string;
    /** Show at least this many tags even if they don't fit (they truncate instead). */
    minVisible?: number;
  } = $props();

  // Shows as many tags as fit on one line, then "+N" for the rest.
  // Every tag is rendered first (also on the server), so their natural widths can be
  // measured once; resizes then re-fit from those cached widths without re-measuring.
  const GAP_PX = 4; // matches gap-1 below
  let list = $state<HTMLUListElement>();
  let plusProbe = $state<HTMLLIElement>();
  // Resets to "all" whenever the tags change, which also re-triggers measurement below.
  let visibleCount = $derived(tags.length);

  $effect(() => {
    if (!list || !plusProbe || tags.length === 0) return;
    const row = list;
    const widths = Array.from(
      row.querySelectorAll<HTMLElement>(":scope > [data-tag]"),
      (el) => el.offsetWidth,
    );
    const plusWidth = plusProbe.offsetWidth;

    const fit = () => {
      const available = row.clientWidth;
      let used = 0;
      let count = 0;
      for (const [i, width] of widths.entries()) {
        const next = used + (count > 0 ? GAP_PX : 0) + width;
        const hiddenAfter = widths.length - (i + 1);
        const reserve = hiddenAfter > 0 ? GAP_PX + plusWidth : 0;
        if (next + reserve > available) break;
        used = next;
        count++;
      }
      visibleCount = Math.min(tags.length, Math.max(minVisible, count));
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(row);
    return () => observer.disconnect();
  });
</script>

{#if tags.length > 0}
  <ul
    bind:this={list}
    class={twMerge(
      "relative m-0 flex min-w-0 list-none gap-1 overflow-hidden [&>li]:my-0",
      klass,
    )}
  >
    {#each tags as tag, i (tag.id)}
      <!-- Items keep their natural width (shrink-0) so they measure correctly; only the
           last tag forced in by `minVisible` may shrink and truncate. -->
      <li
        data-tag
        class={[
          "flex",
          i >= visibleCount && "hidden",
          i === visibleCount - 1 && i < minVisible ? "min-w-0" : "shrink-0",
        ]}
      >
        <TagChip {tag} class={twMerge("min-w-0 shrink", chipClass)} />
      </li>
    {/each}
    {#if visibleCount < tags.length}
      <li class="flex shrink-0">
        <TagChip
          tag={{ name: `+${tags.length - visibleCount}`, color: null }}
          class={twMerge("tabular-nums", chipClass, plusClass)}
        />
      </li>
    {/if}
    <!-- Invisible probe: the widest "+N" there could be, to reserve room for it. -->
    <li
      bind:this={plusProbe}
      class="invisible absolute flex"
      aria-hidden="true"
    >
      <TagChip
        tag={{ name: `+${tags.length}`, color: null }}
        class={twMerge("tabular-nums", chipClass, plusClass)}
      />
    </li>
  </ul>
{/if}
