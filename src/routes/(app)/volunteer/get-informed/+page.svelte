<script lang="ts">
  import * as m from "$paraglide/messages";
  import * as Card from "$lib/components/ui/card";
  import Smartphone from "@lucide/svelte/icons/smartphone";
  import User from "@lucide/svelte/icons/user";
  import Bell from "@lucide/svelte/icons/bell";
  import BellRing from "@lucide/svelte/icons/bell-ring";
  import Calendar from "@lucide/svelte/icons/calendar";
  import Share2 from "@lucide/svelte/icons/share-2";
  import Instagram from "@lucide/svelte/icons/instagram";
  import Facebook from "@lucide/svelte/icons/facebook";
  import MessageSquare from "@lucide/svelte/icons/message-square";

  const steps = [
    {
      num: 1,
      title: m.volunteer_informed_step1_title,
      icon: Smartphone,
      descHtml: `${m.volunteer_informed_step1_desc()} <a href="https://apps.apple.com/se/app/d-sektionen/id6444569402?l=en" class="link" target="_blank" rel="noreferrer">iOS</a> och <a href="https://play.google.com/store/apps/details?id=se.dsek" class="link" target="_blank" rel="noreferrer">Android</a>.`,
    },
    {
      num: 2,
      title: m.volunteer_informed_step2_title,
      icon: User,
      descHtml: `Vid problem: kontakta <a href="mailto:processmastare@dsek.se" class="link">processmastare@dsek.se</a> eller <a href="mailto:root@dsek.se" class="link">root@dsek.se</a> (<a href="https://www.dsek.se/committees/cpu" class="link" target="_blank" rel="noreferrer">CPU</a>).`,
    },
    {
      num: 3,
      title: m.volunteer_informed_step3_title,
      icon: Bell,
      descHtml: m.volunteer_informed_step3_desc(),
    },
    {
      num: 4,
      title: m.volunteer_informed_step4_title,
      icon: BellRing,
      descHtml: m.volunteer_informed_step4_desc(),
    },
    {
      num: 5,
      title: m.volunteer_informed_step5_title,
      icon: Calendar,
      descHtml: `Lägg in D-sek-kalendern i Google Calendar eller iCal via <a href="https://www.dsek.se/events/subscribe" class="link" target="_blank" rel="noreferrer">dsek.se/events/subscribe</a>, eller gå till <a href="https://www.dsek.se/events" class="link" target="_blank" rel="noreferrer">dsek.se/events</a> och tryck "Prenumerera".`,
    },
    {
      num: 6,
      title: m.volunteer_informed_step6_title,
      icon: Share2,
      descHtml: `Följ D-sektionen på Instagram och Facebook (många utskott har egna också). Och gå med i sektionens <a href="https://discord.com/invite/wxHQcvZ38p" class="link" target="_blank" rel="noreferrer">Discord</a>.`,
      socials: true,
    },
  ];
</script>

<div class="flex flex-col gap-8">
  <div class="flex flex-col gap-2">
    <h2 class="font-sans text-3xl font-bold tracking-tight">
      {m.volunteer_informed_title()}
    </h2>
    <p class="text-muted-foreground text-md max-w-3xl leading-relaxed">
      {m.volunteer_informed_subtitle()}
    </p>
  </div>

  <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {#each steps as step (step.num)}
      <Card.Root
        class="border-border/80 bg-card relative pt-6 transition-all hover:shadow-md"
      >
        <!-- Circular absolute badge -->
        <div
          class="bg-primary absolute -top-3 -left-3 flex size-8 items-center justify-center rounded-full text-sm font-bold text-white shadow-[0_0_10px_rgba(242,128,161,0.5)]"
        >
          {step.num}
        </div>

        <Card.Header class="pb-3">
          <div class="flex items-center gap-3">
            <div class="bg-primary/10 text-primary rounded-lg p-2">
              <step.icon class="size-5" />
            </div>
            <Card.Title class="text-base leading-tight font-semibold">
              {step.title()}
            </Card.Title>
          </div>
        </Card.Header>

        <Card.Content class="text-muted-foreground text-sm leading-relaxed">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          <p>{@html step.descHtml}</p>

          {#if step.socials}
            <div class="mt-4 flex items-center gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                class="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram class="size-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                class="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook class="size-5" />
              </a>
              <a
                href="https://discord.com/invite/wxHQcvZ38p"
                target="_blank"
                rel="noreferrer"
                class="text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageSquare class="size-5" />
              </a>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    {/each}
  </div>
</div>
