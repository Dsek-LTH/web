<script lang="ts">
  import { getFileUrl } from "$lib/files/client";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  let {
    committee,
    class: klass,
    children,
  }: {
    committee: Pick<
      ExtendedPrismaModel<"Committee">,
      "darkImageUrl" | "lightImageUrl" | "shortName" | "symbolUrl" | "name"
    > | null;
    class?: string;
    /** Optional content rendered on top of the pattern (e.g. an overlay). */
    children?: Snippet;
  } = $props();

  let other = $derived(committee?.shortName == "other");
  /** Fallback to the D-sektionen guild logo when the committee has no icon. */
  const FALLBACK =
    "https://raw.githubusercontent.com/Dsek-LTH/grafik/refs/heads/main/guild/dsek/color.svg";

  // `lightImageUrl` is the icon for light theme, `darkImageUrl` for dark theme
  // — mirrors the behaviour of CommitteeIcon.
  let dark = $derived(
    (other
      ? FALLBACK
      : committee?.symbolUrl?.endsWith("light.svg")
        ? committee.symbolUrl.slice(0, -9) + "dark.svg"
        : committee?.symbolUrl) ?? FALLBACK,
  );
  let light = $derived(
    (other
      ? FALLBACK
      : committee?.symbolUrl?.endsWith("dark.svg")
        ? committee.symbolUrl.slice(0, -8) + "light.svg"
        : committee?.symbolUrl) ?? FALLBACK,
  );

  const TILE = 104;
  const ICON = 46;
  const ROTATION = -16;
  const a = TILE * 0.25 - ICON / 2;
  const b = TILE * 0.75 - ICON / 2;

  const uid = $props.id();
</script>

<!--
  @component
  A placeholder background for landscape media (e.g. an article without an
  image). It tiles the committee's icon in a scattered, diagonal half-drop
  pattern over a muted background. Falls back to the guild logo when the
  committee (or its icon) is missing.
-->

{#snippet layer(href: string, id: string, opacity: number, klass: string)}
  <svg
    class={cn("absolute inset-0 size-full", klass)}
    style:opacity
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <pattern
        {id}
        width={TILE}
        height={TILE}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate({ROTATION})"
      >
        <image {href} x={a} y={a} width={ICON} height={ICON} />
        <image {href} x={b} y={b} width={ICON} height={ICON} />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#{id})" />
  </svg>
{/snippet}

<div
  class={cn("bg-muted-background relative overflow-hidden", klass)}
  role="img"
  aria-label="{committee?.name ?? 'D-sektionen'} placeholder"
>
  {@render layer(light, `${uid}-light`, 0.13, "block dark:hidden")}
  {@render layer(dark, `${uid}-dark`, 0.17, "hidden dark:block")}
  {@render children?.()}
</div>
