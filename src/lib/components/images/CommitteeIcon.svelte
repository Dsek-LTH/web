<script lang="ts">
  import { getFileUrl } from "$lib/files/client";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import type { EventHandler } from "svelte/elements";

  export let committee: Pick<
    ExtendedPrismaModel<"Committee">,
    "darkImageUrl" | "lightImageUrl" | "monoImageUrl" | "nameSv"
  > | null;
  export let useMono = false;

  const FALLBACK = {
    mono: "https://raw.githubusercontent.com/Dsek-LTH/grafik/main/guild/d_sektionen/full/bw.svg",
    color:
      "https://raw.githubusercontent.com/Dsek-LTH/grafik/main/guild/d_sektionen/full/color.svg",
  };

  /** Fallback to D-sektionen icon if the committee icon is not found */
  const onError =
    (imageUrl: string): EventHandler =>
    (event) => {
      if (event.target instanceof HTMLImageElement) {
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
    on:error={onError(FALLBACK.mono)}
  />
{:else}
  <!-- dark/light support -->
  <img
    src={getFileUrl(committee?.darkImageUrl) ?? FALLBACK.color}
    alt="{committee?.nameSv} icon"
    class="hidden dark:block"
    on:error={onError(FALLBACK.color)}
  />
  <img
    src={getFileUrl(committee?.lightImageUrl) ?? FALLBACK.color}
    alt="{committee?.nameSv} icon"
    class="block dark:hidden"
    on:error={onError(FALLBACK.color)}
  />
{/if}
