<script lang="ts">
  import { getFileUrl } from "$lib/files/client";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

  export let committee: Pick<
    ExtendedPrismaModel<"Committee">,
    "symbolUrl" | "name"
  >;
  $: dark = committee.symbolUrl?.endsWith("light.svg")
    ? committee.symbolUrl.slice(0, -9) + "dark.svg"
    : committee.symbolUrl;
  $: light = committee.symbolUrl?.endsWith("dark.svg")
    ? committee.symbolUrl.slice(0, -8) + "light.svg"
    : committee.symbolUrl;

  $: differentDarkLight = dark !== light;
</script>

{#if differentDarkLight}
  <object
    data="https://raw.githubusercontent.com/Dsek-LTH/grafik/main/guild/d_sektionen/symbol/d.svg"
    type="“image/svg"
    title="{committee.name} symbol"
    class="relative aspect-square"
  >
    <img
      src={getFileUrl(dark)}
      alt="{committee.name} symbol"
      class="absolute inset-0 hidden h-full w-full object-contain dark:block"
    />
    <img
      src={getFileUrl(light)}
      alt="{committee.name} symbol"
      class="absolute inset-0 h-full w-full object-contain dark:hidden"
    />
  </object>
{:else}
  <object
    data="https://raw.githubusercontent.com/Dsek-LTH/grafik/main/guild/d_sektionen/symbol/d.svg"
    type="“image/svg"
    title="{committee.name} symbol"
    class="aspect-square"
  >
    <img
      src={getFileUrl(committee.symbolUrl)}
      alt="{committee.name} symbol"
      class="h-full w-full object-contain"
    />
  </object>
{/if}
