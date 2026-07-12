<script lang="ts">
  import * as m from "$paraglide/messages";
  import * as Card from "$lib/components/ui/card";
  import { Separator } from "$lib/components/ui/separator";
  import Users from "@lucide/svelte/icons/users";
  import Landmark from "@lucide/svelte/icons/landmark";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import Map from "@lucide/svelte/icons/map";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import Music from "@lucide/svelte/icons/music";
  import Theater from "@lucide/svelte/icons/theater";
  import PartyPopper from "@lucide/svelte/icons/party-popper";
  import Globe from "@lucide/svelte/icons/globe";
  import { resolve } from "$app/paths";

  const coreGuild = [
    {
      title: m.volunteer_about_committees_title,
      icon: Users,
      desc: m.volunteer_about_committees_desc,
      link: "/(app)/committees",
      isInternal: true,
    },
    {
      title: m.volunteer_about_board_title,
      icon: Landmark,
      desc: m.volunteer_about_board_desc,
      link: "/(app)/board",
      isInternal: true,
    },
    {
      title: m.volunteer_about_dchip_title,
      icon: Sparkles,
      desc: m.volunteer_about_dchip_desc,
      link: "https://www.dchip.se/sv/",
      isInternal: false,
    },
  ] as const;

  const outsideGuild = [
    {
      title: m.volunteer_about_tlth_title,
      icon: Landmark,
      desc: m.volunteer_about_tlth_desc,
      link: "https://www.tlth.se/",
    },
    {
      title: m.volunteer_about_sas_title,
      icon: Music,
      desc: m.volunteer_about_sas_desc,
      link: "mailto:sangarstridsforman@dsek.se",
    },
    {
      title: m.volunteer_about_spex_title,
      icon: Theater,
      desc: m.volunteer_about_spex_desc,
      link: null,
    },
    {
      title: m.volunteer_about_karneval_title,
      icon: PartyPopper,
      desc: m.volunteer_about_karneval_desc,
      link: "https://lundakarnevalen.se/",
    },
    {
      title: m.volunteer_about_studentlund_title,
      icon: Globe,
      desc: m.volunteer_about_studentlund_desc,
      link: "https://www.studentlund.se/",
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
    { name: "Krischanstaspääxet", link: "https://www.krnation.se/spaeaex" },
    { name: "Lundaspexarna", link: "http://www.lundaspexarna.se/" },
    { name: "Lunds studentteater", link: "http://www.lundsstudentteater.se/" },
    { name: "Toddyspexarna", link: "http://toddyspexarna.se/" },
    { name: "Var GladSpexarna", link: "http://www.vargladspexarna.se/" },
  ] as const;
</script>

<div class="flex flex-col gap-10">
  <!-- Header -->
  <div class="flex flex-col gap-2">
    <h2 class="font-sans text-3xl font-bold tracking-tight">
      {m.volunteer_about_title()}
    </h2>
    <p class="text-muted-foreground text-md max-w-3xl leading-relaxed">
      {m.volunteer_about_subtitle()}
    </p>
  </div>

  <!-- Core Guild Structure -->
  <section class="grid grid-cols-1 gap-6 md:grid-cols-3">
    {#each coreGuild as item (item.link)}
      <Card.Root
        class="bg-card border-border/80 hover:border-primary/50 flex flex-col transition-colors"
      >
        <Card.Header class="pb-3">
          <div class="flex items-center gap-3">
            <div class="bg-primary/10 text-primary rounded-lg p-2">
              <item.icon class="size-5" />
            </div>
            <Card.Title class="flex items-center gap-1.5 text-lg font-semibold">
              <span>{item.title()}</span>
            </Card.Title>
          </div>
        </Card.Header>
        <Card.Content
          class="text-muted-foreground flex-1 text-sm leading-relaxed"
        >
          {item.desc()}
        </Card.Content>
        <Card.Footer class="pt-0">
          <a
            href={item.isInternal
              ? resolve(item.link as "/(app)/board" | "/(app)/committees")
              : item.link}
            target={item.isInternal ? undefined : "_blank"}
            rel="noreferrer"
            class="text-primary flex items-center gap-1 text-xs font-semibold hover:underline"
          >
            <span>{m.volunteer_landing_explore_committees()}</span>
            <ExternalLink class="size-3" />
          </a>
        </Card.Footer>
      </Card.Root>
    {/each}
  </section>

  <!-- Sektionskarta Explanation -->
  <section
    class="border-border/80 bg-muted-background flex items-start gap-4 rounded-2xl border p-6 md:p-8"
  >
    <div class="bg-primary/10 text-primary shrink-0 rounded-xl p-3">
      <Map class="size-6" />
    </div>
    <div class="flex flex-col gap-2">
      <h3 class="font-sans text-lg font-semibold">
        {m.volunteer_about_map_title()}
      </h3>
      <p class="text-muted-foreground max-w-4xl text-sm leading-relaxed">
        {m.volunteer_about_map_desc()}
      </p>
    </div>
  </section>

  <Separator />

  <!-- Outside the Guild -->
  <section class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h2 class="font-sans text-2xl font-bold tracking-tight">
        {m.volunteer_about_outside_title()}
      </h2>
      <p class="text-muted-foreground max-w-3xl text-sm leading-relaxed">
        {m.volunteer_about_outside_subtitle()}
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each outsideGuild as item (item.title)}
        <Card.Root class="bg-card border-border/80 flex flex-col">
          <Card.Header class="pb-3">
            <div class="flex items-center gap-3">
              <div class="bg-primary/10 text-primary rounded-lg p-2">
                <item.icon class="size-5" />
              </div>
              <Card.Title class="text-base font-semibold">
                {item.title()}
              </Card.Title>
            </div>
          </Card.Header>
          <Card.Content
            class="text-muted-foreground flex-1 text-xs leading-relaxed"
          >
            {item.desc()}
          </Card.Content>
          {#if item.link}
            <Card.Footer class="pt-0">
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                class="text-primary flex items-center gap-1 text-xs font-semibold hover:underline"
              >
                <span
                  >{item.title() === m.volunteer_about_sas_title()
                    ? m.footer_contact()
                    : "Läs mer"}</span
                >
                <ExternalLink class="size-3" />
              </a>
            </Card.Footer>
          {/if}
        </Card.Root>
      {/each}
    </div>

    <!-- Nations List -->
    <div class="mt-4 flex flex-col gap-3">
      <h4 class="text-base font-semibold">
        {m.volunteer_about_nations_list()}
      </h4>
      <div class="flex flex-wrap gap-2">
        {#each nations as nation (nation.name)}
          <a
            href={nation.link}
            target="_blank"
            rel="noreferrer"
            class="border-border text-muted-foreground hover:text-primary hover:border-primary/50 bg-card rounded-full border px-4 py-1.5 text-xs shadow-xs transition-colors"
          >
            {nation.name}
          </a>
        {/each}
      </div>
      <p class="text-muted-foreground mt-1 text-[11px] italic">
        *Smålands Nation är inte med i Studentlund.
      </p>
    </div>

    <!-- Spex List -->
    <div class="mt-4 flex flex-col gap-3">
      <h4 class="text-base font-semibold">{m.volunteer_about_spex_list()}</h4>
      <div class="flex flex-wrap gap-2">
        {#each spex as item (item.name)}
          {#if item.link}
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              class="border-border text-muted-foreground hover:text-primary hover:border-primary/50 bg-card rounded-full border px-4 py-1.5 text-xs shadow-xs transition-colors"
            >
              {item.name}
            </a>
          {:else}
            <span
              class="border-border text-muted-foreground bg-muted-background rounded-full border px-4 py-1.5 text-xs select-none"
            >
              {item.name}
            </span>
          {/if}
        {/each}
      </div>
    </div>
  </section>
</div>
