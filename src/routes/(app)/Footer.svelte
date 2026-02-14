<script lang="ts">
  import DsekLogo from "$lib/components/DsekLogo.svelte";
  import { twMerge } from "tailwind-merge";

  import { getFooterRoutes } from "../routes";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import * as m from "$paraglide/messages";
  import {
    siDiscord,
    siInstagram,
    siFacebook,
    siYoutube,
    siGithub,
  } from "simple-icons";
  import { page } from "$app/state";
</script>

<div
  class="bg-muted-background text-muted-foreground flex min-w-screen flex-col justify-center border-t-[1px]"
>
  <div class="container mx-auto py-0 md:px-8 md:py-4 xl:px-32">
    <section
      class="flex flex-col justify-center py-11 md:flex-row md:justify-between"
    >
      <aside class="mx-8 mb-4 md:mb-0">
        <div>
          <h1
            class="text-foreground text-3xl leading-9 font-bold md:text-5xl md:leading-[56px]"
          >
            Er linje,<br class="hidden md:inline" /> Er färg!
          </h1>
          <p class="m-0 md:mt-2">– Evert Taube</p>
        </div>
        {@render socialIcons("hidden md:flex")}
      </aside>
      {@render mobileFooterLinks("lg:hidden")}
      {@render desktopFooterLinks("lg:flex hidden")}
    </section>

    <section
      class="flex flex-col items-center justify-between border-t-[1px] py-5 md:flex-row md:py-11"
    >
      {@render socialIcons("flex md:hidden")}
      <div class="mt-7 flex flex-row items-center md:mt-0">
        <DsekLogo
          variant="letter"
          class="hover:fill-rosa-400 fill-rosa-400 size-6"
        />
        <span
          class="text-foreground ml-2 text-[16px] leading-[24px] font-medium"
          >D-sektionen inom TLTH</span
        >
      </div>
      <div class="hidden flex-row justify-between *:mx-7 md:flex">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <span>{@html m.nav_postal_address()}</span>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <span>{@html m.nav_visitor_address()}</span>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <span>{@html m.nav_organisation_number()}</span>
      </div>
    </section>
  </div>
</div>

{#snippet socialIcons(klass: string)}
  <div
    class={twMerge("text-muted-foreground mt-5 flex flex-row *:mx-3", klass)}
  >
    {#if page.data.member}
      <a href="https://discord.com/invite/wxHQcvZ38p"
        ><svg
          role="img"
          fill="var(--muted-foreground)"
          height="16"
          width="16"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          ><title>Discord</title><path d={siDiscord.path} /></svg
        >
      </a>
    {/if}
    <a href="https://instagram.com/dseklth">
      <svg
        role="img"
        fill="var(--muted-foreground)"
        height="16"
        width="16"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        ><title>Instagram</title><path d={siInstagram.path} /></svg
      ></a
    >
    <a href="https://facebook.com/Dsektionen"
      ><svg
        role="img"
        fill="var(--muted-foreground)"
        height="16"
        width="16"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        ><title>Facebook</title><path d={siFacebook.path} /></svg
      ></a
    >
    <a href="https://youtube.com/channel/UCqBtN7xlh4_VvywKaRiGfkw">
      <svg
        role="img"
        fill="var(--muted-foreground)"
        height="16"
        width="16"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        ><title>YouTube</title><path d={siYoutube.path} /></svg
      ></a
    >
    <a href="https://github.com/Dsek-LTH"
      ><svg
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        fill="var(--muted-foreground)"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        class="lucide lucide-linkedin-icon lucide-linkedin"
        ><title>Github</title><path d={siGithub.path} /></svg
      ></a
    >
    <a href="https://linkedin.com/company/datatekniksektionen-vid-tlth"
      ><svg
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        fill="var(--muted-foreground)"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        class="lucide lucide-linkedin-icon lucide-linkedin"
        ><title>LinkedIn</title><path
          d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
        /><rect width="4" height="12" x="2" y="9" /><circle
          cx="4"
          cy="4"
          r="2"
        /></svg
      ></a
    >
  </div>
{/snippet}

{#snippet mobileFooterLinks(klass: string)}
  <div
    class={twMerge(klass, "flex flex-col justify-between *:mx-4 lg:flex-row")}
  >
    {#each getFooterRoutes() as route (route.title)}
      <details class="group my-1 w-50 text-left">
        <summary class="cursor-pointer list-none">
          <ChevronRight
            class="text-muted-foreground mb-[10px] inline group-open:hidden"
          />
          <ChevronDown
            class="text-muted-foreground mb-[10px] hidden group-open:inline"
          />
          <h3 class="underline-none text-foreground mb-1 inline font-medium">
            {route.title}
          </h3>
        </summary>
        <div class="flex flex-col">
          {#each route.children as child (child.title)}
            <a
              href={child.path}
              class="text-muted-foreground my-[2px] ml-3 no-underline"
            >
              {child.title}{#if child.path?.startsWith("https://")}
                <ExternalLink class="mb-[4px] inline h-[0.8lh]" />
              {/if}
            </a>
          {/each}
        </div>
      </details>
    {/each}
    <details class="group my-1 text-left">
      <summary class="cursor-pointer list-none">
        <ChevronRight
          class="text-muted-foreground mb-[10px] inline group-open:hidden"
        />
        <ChevronDown
          class="text-muted-foreground mb-[10px] hidden group-open:inline"
        />
        <h3 class="underline-none text-foreground mb-1 inline font-medium">
          {m.nav_address()}
        </h3>
      </summary>
      <div class="flex flex-col">
        <div class="flex flex-col justify-between *:mx-7 *:mb-3">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          <span>{@html m.nav_postal_address()}</span>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          <span>{@html m.nav_visitor_address()}</span>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          <span>{@html m.nav_organisation_number()}</span>
        </div>
      </div>
    </details>
  </div>
{/snippet}

{#snippet desktopFooterLinks(klass: string)}
  <div class={twMerge(klass, "flex-col justify-between *:mx-4 lg:flex-row")}>
    {#each getFooterRoutes() as route (route.title)}
      <div class="flex flex-col">
        <h3 class="text-foreground mb-1">{route.title}</h3>
        {#each route.children as child (child.title)}
          <a
            href={child.path}
            class="text-muted-foreground my-[1px] no-underline"
          >
            {child.title}{#if child.path?.startsWith("https://")}
              <ExternalLink class="mb-[4px] inline h-[0.8lh]" />
            {/if}
          </a>
        {/each}
      </div>
    {/each}
  </div>
{/snippet}
