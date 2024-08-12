<script lang="ts">
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { i18n } from "$lib/utils/i18n";
  import { POST_REVEAL_PREFIX } from "$lib/components/postReveal/types";

  const links = [
    {
      label: "Staben",
      link: "staben",
    },
    {
      label: "Pepparna",
      link: "peppers",
    },
    {
      label: "Studenthälsan",
      link: "student-health",
    },
    {
      label: "Sektionen",
      link: "sektionen",
    },
    {
      label: "FAQ",
      link: "faq",
    },
  ];
  $: path = i18n
    .route($page.url.pathname)
    .replace(`${POST_REVEAL_PREFIX}/wikia/`, "");
  $: console.log(path);
  $: currentLink = links.find((link) => link.link === path) ?? links[0];
  $: currentLinkIndex = currentLink ? links.indexOf(currentLink) : undefined;
  let elements: HTMLAnchorElement[] = [];
  let scroller: HTMLDivElement;

  $: if (browser && currentLinkIndex !== undefined && currentLinkIndex >= 0) {
    const el = elements[currentLinkIndex];
    if (el) {
      el.scrollIntoView({
        block: "end",
        inline: "nearest",
      });
      scroller.scrollBy({
        left: el.offsetLeft - scroller.offsetWidth / 2 + el.offsetWidth / 2,
        behavior: "smooth",
      });
    }
  }
</script>

<SetPageTitle title="Wikia" />

<div
  class="sticky -top-1 -mx-10 flex gap-2 overflow-x-auto bg-base-100 px-4 py-2 pt-3"
  bind:this={scroller}
>
  {#each links as link, i (link.link)}
    {@const isCurrent = link === currentLink}
    <a
      bind:this={elements[i]}
      id={isCurrent ? "active" : undefined}
      href={link.link}
      class="btn btn-primary"
      class:btn-primary={isCurrent}
      class:btn-outline={!isCurrent}
    >
      {link.label}
    </a>
  {/each}
</div>

<div class="space-y-12 py-6">
  <slot />
</div>
