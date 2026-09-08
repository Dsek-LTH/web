<script lang="ts">
  import * as m from "$paraglide/messages";
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import MessageCircle from "@lucide/svelte/icons/message-circle";
  import Info from "@lucide/svelte/icons/info";
  import Users from "@lucide/svelte/icons/users";
  import Clock from "@lucide/svelte/icons/clock";
  import FileText from "@lucide/svelte/icons/file-text";
  import ClipboardCheck from "@lucide/svelte/icons/clipboard-check";
  import { resolve } from "$app/paths";

  const cards = [
    {
      path: "/(app)/volunteer/get-informed",
      title: m.volunteer_nav_informed,
      desc: m.volunteer_informed_subtitle,
      icon: Info,
      step: "1",
    },
    {
      path: "/(app)/volunteer/about-guild",
      title: m.volunteer_nav_about,
      desc: m.volunteer_about_subtitle,
      icon: Users,
      step: "2",
    },
    {
      path: "/(app)/volunteer/involvement",
      title: m.volunteer_nav_involvement,
      desc: m.volunteer_involvement_subtitle,
      icon: Clock,
      step: "3",
    },
    {
      path: "/(app)/volunteer/meetings",
      title: m.volunteer_nav_meetings,
      desc: m.volunteer_meetings_subtitle,
      icon: FileText,
      step: "4",
    },
    {
      path: "/(app)/volunteer/apply",
      title: m.volunteer_nav_apply,
      desc: m.volunteer_apply_subtitle,
      icon: ClipboardCheck,
      step: "5",
    },
  ] as const;
</script>

<div class="flex flex-col gap-10">
  <!-- Hero Section -->
  <header class="flex flex-col gap-4">
    <p class="text-primary font-mono text-sm tracking-widest uppercase">
      {m.volunteer_header_for_new()}
    </p>
    <h1
      class="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
    >
      {m.volunteer_header_title()}
    </h1>
    <p class="text-muted-foreground max-w-3xl text-lg leading-relaxed">
      {m.volunteer_header_desc()}
    </p>
  </header>

  <!-- Step Grid Dashboard -->
  <section class="grid grid-cols-1 gap-6 md:grid-cols-2">
    {#each cards as card (card.path)}
      <a href={resolve(card.path)} class="group block">
        <Card.Root
          class="group-hover:border-primary/50 bg-card relative h-full overflow-hidden border transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg"
        >
          <div
            class="text-muted/20 font-display absolute -top-6 -right-6 text-7xl font-bold select-none"
          >
            {card.step}
          </div>
          <Card.Header class="pb-3">
            <div class="flex items-center gap-3">
              <div class="bg-primary/10 text-primary rounded-lg p-2">
                <card.icon class="size-5" />
              </div>
              <Card.Title
                class="group-hover:text-primary text-xl font-semibold transition-colors"
              >
                {card.title()}
              </Card.Title>
            </div>
          </Card.Header>
          <Card.Content>
            <p class="text-muted-foreground text-sm leading-relaxed">
              {card.desc()}
            </p>
          </Card.Content>
          <Card.Footer
            class="text-primary flex items-center gap-1 text-xs font-semibold"
          >
            <span>{m.volunteer_btn_get_started()}</span>
            <ArrowRight
              class="size-3 transition-transform group-hover:translate-x-1"
            />
          </Card.Footer>
        </Card.Root>
      </a>
    {/each}
  </section>

  <!-- Call to action footer -->
  <section
    class="border-border/80 bg-muted-background relative overflow-hidden rounded-2xl border p-8"
  >
    <div class="relative z-10 flex max-w-3xl flex-col gap-6">
      <h2 class="font-sans text-2xl font-bold">
        {m.volunteer_landing_ready_title()}
      </h2>
      <p class="text-muted-foreground leading-relaxed">
        {m.volunteer_landing_ready_desc()}
      </p>
      <div class="flex flex-wrap gap-4">
        <Button
          href={resolve("/(app)/about#committees")}
          class="bg-primary hover:bg-rosa-hover flex items-center gap-2 text-white"
        >
          <span>{m.volunteer_landing_explore_committees()}</span>
          <ArrowRight class="size-4" />
        </Button>
        <Button
          href="https://discord.com/invite/wxHQcvZ38p"
          target="_blank"
          rel="noreferrer"
          variant="outline"
          class="flex items-center gap-2"
        >
          <MessageCircle class="size-4 text-[#5865F2]" />
          <span>{m.volunteer_landing_join_discord()}</span>
        </Button>
      </div>
    </div>
  </section>
</div>
