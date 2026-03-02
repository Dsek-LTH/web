<script lang="ts">
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import DOMPurify from "isomorphic-dompurify";
  import * as m from "$paraglide/messages";
  import { Button } from "$lib/components/ui/button";
  import { ArrowRight } from "@lucide/svelte";

  let { data } = $props();

  const breakName = (name: string) => {
    let output = "";
    if (name.includes("utskottet"))
      output = `${name.split("utskottet")[0]}&shy;utskottet`;
    else if (name.includes("kommittén"))
      output = `${name.split("kommittén")[0]}&shy;kommittén`;
    else if (name.includes("mästeriet"))
      output = `${name.split("mästeriet")[0]}&shy;mästeriet`;
    else if (name.includes("rådet"))
      output = `${name.split("rådet")[0]}&shy;rådet`;
    else output = name;
    return DOMPurify.sanitize(output);
  };
</script>

<SetPageTitle title={m.about_guild()} />

<div class="layout-container">
  <div class="flex flex-row items-center justify-between">
    <div class="md:w-7/12">
      <h1>{m.about_guild()}</h1>

      <p>{m.about_guild_prose_guild()}</p>
      <p>{m.about_guild_prose_committees()}</p>
      <p>{m.about_guild_prose_union()}</p>
    </div>
    <div class="hidden w-4/12 rounded-lg md:block">
      <div class="bg-muted-background rounded-lg border-[1px] shadow-xl">
        <img
          class="rounded-lg"
          src="https://files.dsek.se/files/public/photos/stock3.jpg"
          alt="guild"
        />
      </div>
    </div>
  </div>
  <span id="committees" class="mb-12 h-0"></span>
  <h2 class="mt-12 mb-4">{m.committees()}</h2>

  <div
    class="grid grid-cols-1 gap-6 px-12 sm:grid-cols-2 sm:px-0 md:grid-cols-3 lg:grid-cols-4"
  >
    {#each data.committees
      .filter((e) => e.shortName != "dchip")
      .sort( (e1, e2) => e1.name.localeCompare(e2.name), ) as committee (committee.id)}
      <a class="group block" href="/committees/{committee.shortName}">
        <div
          class="border-border flex h-full w-full flex-grow flex-col rounded-md border-[1px]"
        >
          <div
            class="bg-rosa-300 relative aspect-square rounded-t-md bg-cover bg-center"
            style="background-image: url('{committee.previewUrl}')"
          >
            <CommitteeIcon
              override={committee.isBannerTextLight ? "light" : "dark"}
              {committee}
              class="absolute top-2 left-2 size-16"
            />
          </div>
          <div
            class="group-hover:bg-muted-background flex flex-col gap-1 p-3 transition-all"
          >
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized before output -->
            <h3>{@html breakName(committee.name)}</h3>
            <span>{committee.description}</span>
          </div>
        </div>
      </a>
    {/each}
  </div>

  <a class="mt-12 block px-12 sm:px-0" href="https://dchip.se">
    <div
      class="border-border hover:bg-muted-background flex flex-col rounded-md border-[1px] transition-all sm:flex-row lg:h-32"
    >
      <div class="relative flex flex-col gap-1 p-4 sm:w-1/2">
        <h3>{m.dchip()}</h3>
        <span>
          {m.about_guild_prose_dchip()}
        </span>
      </div>
      <Button class="mb-4 ml-4 flex w-fit sm:hidden" variant="rosa"
        >www.dchip.se <ArrowRight /></Button
      >
      <div
        class="before:to-[rgba(0, 0, 0, 1)] before:from-accent bg-rosa-300 relative hidden w-1/2 rounded-r-md bg-cover bg-center before:absolute before:left-0 before:mr-0 before:h-full before:w-60 before:bg-linear-to-r sm:block"
        style="background-image: url('https://files.dsek.se/files/public/photos/dchip.jpg')"
      >
        <img
          src="https://www.dchip.se/images/rosa_panter.png"
          alt="dchip"
          class="absolute top-4 right-4 h-24"
        />
      </div>
    </div>
  </a>
</div>
