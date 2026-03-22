<script lang="ts">
  import { getFileUrl } from "$lib/files/client";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { cn } from "$lib/utils";

  let {
    committee = {
      symbolUrl: "",
      shortName: "other",
      name: "",
    },
    size = "default",
    class: klass,
  }: {
    committee?: Pick<
      ExtendedPrismaModel<"Committee">,
      "symbolUrl" | "shortName" | "name"
    >;
    size?: "default" | "sm";
    class?: string;
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

  let sizeClass = $derived(size == "default" ? "w-8" : "w-6");
</script>

{#if differentDarkLight}
  <object
    type="image/svg"
    title="{committee.name} symbol"
    class={cn("relative flex aspect-square justify-center", klass)}
  >
    <img
      src={getFileUrl(dark)}
      alt="{committee.name} symbol"
      class={cn(sizeClass, "hidden dark:block")}
    />
    <img
      src={getFileUrl(light)}
      alt="{committee.name} symbol"
      class={cn(sizeClass, "dark:hidden")}
    />
  </object>
{:else}
  <object
    type="image/svg"
    title="{committee.name} symbol"
    data={getFileUrl(symbolUrl)}
    class={cn(
      "flex justify-center overflow-visible",
      other ? "mx-1" : "",
      klass,
    )}
  >
    {#if other}
      <img
        src={FALLBACK_URL}
        alt="{committee.name} symbol"
        class={cn(sizeClass, "text-rosa-400")}
      />{:else}
      <img
        src={getFileUrl(symbolUrl)}
        alt="{committee.name} symbol"
        class={cn(sizeClass, "text-rosa-400")}
      />
    {/if}
  </object>
{/if}
