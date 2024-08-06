<script lang="ts">
  import { getImageUrl } from "$lib/files/images";
  import type { Committee } from "@prisma/client";

  export let committee: Pick<
    Committee,
    "darkImageUrl" | "lightImageUrl" | "monoImageUrl" | "name"
  >;
  export let useMono = false;
</script>

{#if useMono}
  <object
    data="https://raw.githubusercontent.com/Dsek-LTH/grafik/main/guild/d_sektionen/full/bw.svg"
    type="“image/svg"
    title="{committee.name} icon"
    class="aspect-square"
  >
    <img
      src={getImageUrl(committee.monoImageUrl)}
      alt="{committee.name} icon"
      class="h-full w-full object-contain"
    />
  </object>
{:else}
  <!-- dark/light support -->
  <object
    data="https://raw.githubusercontent.com/Dsek-LTH/grafik/main/guild/d_sektionen/full/color.svg"
    type="“image/svg"
    title="{committee.name} icon"
    class="hidden aspect-square dark:block"
  >
    <img
      src={getImageUrl(committee.darkImageUrl)}
      alt="{committee.name} oicon"
      class="h-full w-full object-contain"
    />
  </object>
  <object
    data="https://raw.githubusercontent.com/Dsek-LTH/grafik/main/guild/d_sektionen/full/color.svg"
    type="“image/svg"
    title="{committee.name} icon"
    class="aspect-square dark:hidden"
  >
    <img
      src={getImageUrl(committee.lightImageUrl)}
      alt="{committee.name} icon"
      class="h-full w-full object-contain"
    />
  </object>
{/if}
