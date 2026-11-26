<script lang="ts">
  import * as m from "$paraglide/messages";
  import { Separator } from "$lib/components/ui/separator";
  import GuideCard from "../GuideCard.svelte";
  import GuildMap from "../GuildMap.svelte";
  import Users from "@lucide/svelte/icons/users";
  import Landmark from "@lucide/svelte/icons/landmark";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import Music from "@lucide/svelte/icons/music";
  import Theater from "@lucide/svelte/icons/theater";
  import PartyPopper from "@lucide/svelte/icons/party-popper";
  import Globe from "@lucide/svelte/icons/globe";
  import Drum from "@lucide/svelte/icons/drum";
  import { resolve } from "$app/paths";

  const coreGuild = [
    {
      title: m.volunteer_about_committees_title,
      icon: Users,
      desc: m.volunteer_about_committees_desc,
      href: resolve("/(app)/about#committees"),
      cta: m.volunteer_about_cta_committees,
      external: false,
    },
    {
      title: m.volunteer_about_board_title,
      icon: Landmark,
      desc: m.volunteer_about_board_desc,
      href: resolve("/(app)/board"),
      cta: m.volunteer_about_cta_board,
      external: false,
    },
    {
      title: m.volunteer_about_dchip_title,
      icon: Sparkles,
      desc: m.volunteer_about_dchip_desc,
      href: "https://www.dchip.se/sv/",
      cta: m.volunteer_about_cta_dchip,
      external: true,
    },
  ] as const;

  const outsideGuild = [
    {
      title: m.volunteer_about_tlth_title,
      icon: Landmark,
      desc: m.volunteer_about_tlth_desc,
      href: "https://www.tlth.se/",
      cta: m.volunteer_about_cta_readmore,
    },
    {
      title: m.volunteer_about_sas_title,
      icon: Music,
      desc: m.volunteer_about_sas_desc,
      href: "mailto:sangarstridsforman@dsek.se",
      cta: m.footer_contact,
    },
    {
      title: m.volunteer_about_spex_title,
      icon: Theater,
      desc: m.volunteer_about_spex_desc,
      href: undefined,
      cta: undefined,
    },
    {
      title: m.volunteer_about_orchestra_title,
      icon: Drum,
      desc: m.volunteer_about_orchestra_desc,
      href: "https://www.studentlund.se/verksamhet/",
      cta: m.volunteer_about_cta_readmore,
    },
    {
      title: m.volunteer_about_karneval_title,
      icon: PartyPopper,
      desc: m.volunteer_about_karneval_desc,
      href: "https://lundakarnevalen.se/",
      cta: m.volunteer_about_cta_readmore,
    },
    {
      title: m.volunteer_about_nations_title,
      icon: Globe,
      desc: m.volunteer_about_nations_desc,
      href: "https://www.studentlund.se/",
      cta: m.volunteer_about_cta_readmore,
    },
  ] as const;

  const nations = [
    { name: "Östgöta Nation", link: "https://www.ostgota.nu/" },
    { name: "Västgöta Nation", link: "https://vgnation.se/" },
    { name: "Lunds Nation", link: "https://lundsnation.com/" },
    { name: "Malmö Nation", link: "https://www.malmonation.com/" },
    { name: "Helsingkrona Nation", link: "https://helsingkrona.se/" },
    { name: "Sydskånska Nationen", link: "https://sydskanska.se/" },
    { name: "Kristianstads Nation", link: "https://krnation.se/" },
    { name: "Blekingska Nationen", link: "https://www.blekingska.se/" },
    { name: "Göteborgs Nation", link: "https://www.goteborgsnation.com/" },
    { name: "Hallands Nation", link: "https://www.hallandsnation.se/" },
    { name: "Kalmar Nation", link: "https://www.kalmarnation.nu/" },
    { name: "Wermlands Nation", link: "https://www.wermlandsnation.se/" },
    { name: "Smålands Nation*", link: "https://smalands.org/sv/hem/" },
  ] as const;

  const spex = [
    { name: "Boelspexarna", link: "https://www.boelspexarna.se/" },
    { name: "Dolusspexarna", link: "https://sv-se.facebook.com/Dolusspexet/" },
    {
      name: "Hallandsspexet",
      link: "https://www.studentlund.se/verksamhet/hallandsspexet/",
    },
    {
      name: "Helsingkronaspexet",
      link: "https://helsingkrona.se/sv/helsingkronaspexet",
    },
    { name: "Jesperspexet", link: null },
    { name: "Kalmarspexet", link: "https://www.kalmarnation.nu/spex" },
    {
      name: "Krischanstaspääxet",
      link: "https://krnation.se/krischanstaspaaxet/",
    },
    { name: "Lundaspexarna", link: "http://www.lundaspexarna.se/" },
    { name: "Lunds studentteater", link: "http://www.lundsstudentteater.se/" },
    { name: "Toddyspexarna", link: "http://toddyspexarna.se/" },
    { name: "Var GladSpexarna", link: "http://www.vargladspexarna.se/" },
  ] as const;
</script>

{#snippet pills(items: ReadonlyArray<{ name: string; link: string | null }>)}
  <div class="flex flex-wrap gap-2">
    {#each items as item (item.name)}
      {#if item.link}
        <a
          href={item.link}
          target="_blank"
          rel="noreferrer"
          class="border-border text-muted-foreground hover:text-primary hover:border-primary/50 bg-card rounded-full border px-4 py-1.5 text-sm shadow-xs transition-colors"
        >
          {item.name}
        </a>
      {:else}
        <span
          class="border-border text-muted-foreground bg-muted-background rounded-full border px-4 py-1.5 text-sm select-none"
        >
          {item.name}
        </span>
      {/if}
    {/each}
  </div>
{/snippet}

<div class="flex flex-col gap-10">
  <header class="flex flex-col gap-2">
    <h1>{m.volunteer_about_title()}</h1>
    <p class="text-muted-foreground max-w-3xl text-base leading-relaxed">
      {m.volunteer_about_subtitle()}
    </p>
  </header>

  <section class="grid grid-cols-1 gap-6 md:grid-cols-3">
    {#each coreGuild as item, index (item.href)}
      <GuideCard
        title={item.title()}
        description={item.desc()}
        icon={item.icon}
        href={item.href}
        external={item.external}
        cta={item.cta()}
        {index}
      />
    {/each}
  </section>

  <!-- Sektionskarta -->
  <section class="flex flex-col gap-5">
    <div class="flex flex-col gap-2">
      <h2>{m.volunteer_about_map_title()}</h2>
      <p class="text-muted-foreground max-w-3xl text-base leading-relaxed">
        {m.volunteer_about_map_desc()}
      </p>
    </div>
    <GuildMap />
  </section>

  <Separator />

  <!-- Outside the guild -->
  <section class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h2>{m.volunteer_about_outside_title()}</h2>
      <p class="text-muted-foreground max-w-3xl text-base leading-relaxed">
        {m.volunteer_about_outside_subtitle()}
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each outsideGuild as item, index (item.title)}
        <GuideCard
          title={item.title()}
          description={item.desc()}
          icon={item.icon}
          href={item.href}
          external={item.href !== undefined}
          cta={item.cta?.()}
          {index}
        />
      {/each}
    </div>

    <div class="mt-4 flex flex-col gap-3">
      <h3 class="text-lg font-semibold">
        {m.volunteer_about_nations_list()}
      </h3>
      {@render pills(nations)}
      <p class="text-muted-foreground mt-1 text-sm italic">
        {m.volunteer_about_nations_footnote()}
      </p>
    </div>

    <div class="mt-4 flex flex-col gap-3">
      <h3 class="text-lg font-semibold">{m.volunteer_about_spex_list()}</h3>
      {@render pills(spex)}
    </div>
  </section>
</div>
