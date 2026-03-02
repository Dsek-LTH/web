<script lang="ts">
  import { getFileUrl } from "$lib/files/client";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { cn } from "$lib/utils";

  let {
    committee,
    size = "default",
  }: {
    committee: ExtendedPrismaModel<"Committee">;
    size?: "default" | "sm";
  } = $props();

  const FALLBACK_URL =
    "https://raw.githubusercontent.com/Dsek-LTH/grafik/refs/heads/main/guild/dsek/symbol/symbol_rosa.svg";

  let other = $derived(committee.shortName == "other");

  let dark = $derived(
    other
      ? FALLBACK_URL
      : committee.symbolUrl?.endsWith("light.svg")
        ? committee.symbolUrl.slice(0, -9) + "dark.svg"
        : committee.symbolUrl,
  );
  let light = $derived(
    other
      ? FALLBACK_URL
      : committee.symbolUrl?.endsWith("dark.svg")
        ? committee.symbolUrl.slice(0, -8) + "light.svg"
        : committee.symbolUrl,
  );

  let symbolUrl = $derived(other ? FALLBACK_URL : committee.symbolUrl);

  let differentDarkLight = $derived(dark !== light);

  let klass = $derived(size == "default" ? "w-8" : "w-6");
</script>

{#if differentDarkLight}
  <object
    type="image/svg"
    title="{committee.name} symbol"
    class="relative flex aspect-square justify-center"
  >
    <img
      src={getFileUrl(dark)}
      alt="{committee.name} symbol"
      class={cn(klass, "hidden dark:block")}
    />
    <img
      src={getFileUrl(light)}
      alt="{committee.name} symbol"
      class={cn(klass, "dark:hidden")}
    />
  </object>
{:else}
  <object
    type="image/svg"
    title="{committee.name} symbol"
    data={getFileUrl(symbolUrl)}
    class={cn("flex justify-center overflow-visible", other ? "mx-1" : "")}
  >
    {#if other}
      <img
        src={FALLBACK_URL}
        alt="{committee.name} symbol"
        class={cn(klass, "text-rosa-400")}
      />{:else}
      <img
        src={getFileUrl(symbolUrl)}
        alt="{committee.name} symbol"
        class={cn(klass, "text-rosa-400")}
      />
    {/if}
  </object>
{/if}
