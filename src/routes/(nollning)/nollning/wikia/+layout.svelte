<script lang="ts">
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { i18n } from "$lib/utils/i18n";
  import { POST_REVEAL_PREFIX } from "$lib/components/postReveal/types";
  import * as m from "$paraglide/messages";

  const links = [
    {
      label: m.nollning_wikia_map(),
      link: "map",
    },
    {
      label: m.theGuild(),
      link: "sektionen",
    },
    {
      label: m.nollning_wikia_student_health(),
      link: "student-health",
    },
    {
      label: m.nollning_wikia_guildSongs(),
      link: "guild-songs",
    },
    {
      label: m.nolla_wordlist_header(),
      link: "wordlist",
    },
    {
      label: m.nollning_wikia_dressCodes(),
      link: "dress-codes",
    },
    {
      label: "FAQ",
      link: "faq",
    },
    {
      label: m.nollning_wikia_literature(),
      link: "literature",
    },
  ];
  $: path = i18n
    .route($page.url.pathname)
    .replace(`${POST_REVEAL_PREFIX}/wikia/`, "");
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
        behavior: "smooth",
      });
      scroller.scrollBy({
        left:
          el.offsetLeft > scroller.scrollLeft + scroller.offsetWidth / 2
            ? el.offsetWidth
            : -el.offsetWidth, // if true, element is to the right
        behavior: "smooth",
      });
    }
  }
</script>

<SetPageTitle title="Wikia" />

<div
  class="scrollbar-hide sticky -top-1 z-10 -mx-6 flex gap-2 overflow-x-auto bg-base-100 px-6 py-2 pt-3 md:justify-center"
  bind:this={scroller}
>
  {#each links as link, i (link.link)}
    {@const isCurrent = link === currentLink}
    <a
      bind:this={elements[i]}
      id={link.link}
      href={link.link}
      class="btn btn-primary !text-[#4E4A45]"
      class:btn-primary={isCurrent}
      class:btn-outline={!isCurrent}
    >
      {link.label}
    </a>
  {/each}
</div>

<div class="relative z-0 mx-auto max-w-screen-xl space-y-12 py-6">
  <slot />
</div>
