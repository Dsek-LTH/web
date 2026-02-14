<script lang="ts">
  import { getFileUrl } from "$lib/files/client";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { cn } from "$lib/utils";
  import type { EventHandler } from "svelte/elements";

  let {
    committee,
    useMono,
    class: klass,
  }: {
    committee: Pick<
      ExtendedPrismaModel<"Committee">,
      "darkImageUrl" | "lightImageUrl" | "monoImageUrl" | "nameSv"
    > | null;
    useMono?: boolean;
    class?: string;
  } = $props();

  const FALLBACK = {
    mono: "https://raw.githubusercontent.com/Dsek-LTH/grafik/refs/heads/main/guild/dsek/bw.svg",
    color:
      "https://raw.githubusercontent.com/Dsek-LTH/grafik/refs/heads/main/guild/dsek/color.svg",
  };

  /** Fallback to D-sektionen icon if the committee icon is not found */
  const onError =
    (imageUrl: string): EventHandler =>
    (event) => {
      if (
        event.target instanceof HTMLImageElement &&
        (imageUrl != FALLBACK.mono || imageUrl != FALLBACK.color)
      ) {
        event.target.src = imageUrl;
      }
    };
</script>

<!-- 
  @component
  This component renders an icon for a committee. It will render a colored 
  icon by default (with respect to the user's theme), but can be set to
  render a monochrome icon instead. It fallbacks to the guild logo if
  the committee icon is not available.

  Note that `darkImageUrl` corresponds to the icon used in dark theme, 
  and `lightImageUrl` corresponds to the icon used in light theme.
-->

{#if useMono}
  <img
    src={getFileUrl(committee?.monoImageUrl) ?? FALLBACK.mono}
    alt="{committee?.nameSv} icon"
    onerror={onError(FALLBACK.mono)}
    class={klass}
  />
{:else}
  <!-- dark/light support -->
  <img
    src={getFileUrl(committee?.darkImageUrl) ?? FALLBACK.color}
    alt="{committee?.nameSv} icon"
    class={cn("hidden dark:block", klass)}
    onerror={onError(FALLBACK.color)}
  />
  <img
    src={getFileUrl(committee?.lightImageUrl) ?? FALLBACK.color}
    alt="{committee?.nameSv} icon"
    class={cn("block dark:hidden", klass)}
    onerror={onError(FALLBACK.color)}
  />
{/if}
