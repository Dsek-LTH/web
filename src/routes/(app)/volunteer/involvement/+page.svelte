<script lang="ts">
  import * as m from "$paraglide/messages";
  import * as Card from "$lib/components/ui/card";
  import { Separator } from "$lib/components/ui/separator";
  import { Badge } from "$lib/components/ui/badge";
  import CodeXml from "@lucide/svelte/icons/code-xml";
  import Camera from "@lucide/svelte/icons/camera";
  import Hammer from "@lucide/svelte/icons/hammer";
  import Coffee from "@lucide/svelte/icons/coffee";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import Users from "@lucide/svelte/icons/users";
  import Vote from "@lucide/svelte/icons/vote";
  import Gift from "@lucide/svelte/icons/gift";
  import Calendar from "@lucide/svelte/icons/calendar";

  const involveWays = [
    {
      title: m.volunteer_involvement_cpu_title,
      icon: CodeXml,
      desc: m.volunteer_involvement_cpu_desc,
    },
    {
      title: m.volunteer_involvement_infu_title,
      icon: Camera,
      desc: m.volunteer_involvement_infu_desc,
    },
    {
      title: m.volunteer_involvement_kallar_title,
      icon: Hammer,
      desc: m.volunteer_involvement_kallar_desc,
    },
    {
      title: m.volunteer_involvement_cafe_title,
      icon: Coffee,
      desc: m.volunteer_involvement_cafe_desc,
    },
    {
      title: m.volunteer_involvement_srd_title,
      icon: BookOpen,
      desc: m.volunteer_involvement_srd_desc,
    },
    {
      title: m.volunteer_involvement_aktu_title,
      icon: Sparkles,
      desc: m.volunteer_involvement_aktu_desc,
    },
    {
      title: m.volunteer_involvement_sexet_title,
      icon: Users,
      desc: m.volunteer_involvement_sexet_desc,
    },
    {
      title: m.volunteer_involvement_run_title,
      icon: Vote,
      desc: m.volunteer_involvement_run_desc,
    },
  ] as const;

  const benefits = [
    {
      title: m.volunteer_benefits_utskott_title,
      icon: Gift,
      desc: m.volunteer_benefits_utskott_desc,
    },
    {
      title: m.volunteer_benefits_sektion_title,
      icon: Sparkles,
      desc: m.volunteer_benefits_sektion_desc,
    },
    {
      title: m.volunteer_benefits_coffee_title,
      icon: Coffee,
      desc: m.volunteer_benefits_coffee_desc,
    },
    {
      title: m.volunteer_benefits_skiphtes_title,
      icon: Calendar,
      desc: m.volunteer_benefits_skiphtes_desc,
    },
  ] as const;

  const weeklySchedule = [
    {
      day: "Måndag",
      time: "17.15",
      title: m.volunteer_weekly_mon_title,
      place: "iDét",
      desc: m.volunteer_weekly_mon_desc,
    },
    {
      day: "Tisdag",
      time: "12.15–13.00",
      title: m.volunteer_weekly_tue_board_title,
      place: "E:1124",
      desc: m.volunteer_weekly_tue_board_desc,
    },
    {
      day: "Tisdag",
      time: "17.15",
      title: m.volunteer_weekly_tue_infu_title,
      place: "iDét",
      desc: m.volunteer_weekly_tue_infu_desc,
    },
    {
      day: "Tisdag",
      time: "17.30–18.00",
      title: m.volunteer_weekly_tue_run_title,
      place: "Utanför E-huset",
      desc: m.volunteer_weekly_tue_run_desc,
    },
    {
      day: "Onsdag",
      time: "12.15–13.00",
      title: m.volunteer_weekly_wed_title,
      place: "E:1123",
      desc: m.volunteer_weekly_wed_desc,
    },
    {
      day: "Torsdag",
      time: "12.15–13.00",
      title: m.volunteer_weekly_thu_aktu_title,
      place: "E:1123",
      desc: m.volunteer_weekly_thu_aktu_desc,
    },
    {
      day: "Torsdag",
      time: "17.15",
      title: m.volunteer_weekly_thu_kallar_title,
      place: "iDét",
      desc: m.volunteer_weekly_thu_kallar_desc,
    },
  ] as const;

  const months = [
    { name: "Oktober", desc: m.volunteer_timeline_oct() },
    { name: "November", desc: m.volunteer_timeline_nov() },
    { name: "December", desc: m.volunteer_timeline_dec() },
    { name: "Januari", desc: m.volunteer_timeline_jan() },
    { name: "Mars", desc: m.volunteer_timeline_mar() },
    { name: "April", desc: m.volunteer_timeline_apr() },
    { name: "Maj", desc: m.volunteer_timeline_may() },
  ] as const;
</script>

<div class="flex flex-col gap-10">
  <!-- Header -->
  <div class="flex flex-col gap-2">
    <h2 class="font-sans text-3xl font-bold tracking-tight">
      {m.volunteer_involvement_title()}
    </h2>
    <p class="text-muted-foreground text-md max-w-3xl leading-relaxed">
      {m.volunteer_involvement_subtitle()}
    </p>
  </div>

  <!-- Note block -->
  <p
    class="bg-muted-background border-primary max-w-3xl rounded-r-lg border-l-4 p-4 text-sm italic"
  >
    {m.volunteer_involvement_guide_note()}
  </p>

  <!-- Involvement ways -->
  <section class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
    {#each involveWays as item (item.title)}
      <Card.Root
        class="bg-card border-border/80 hover:border-primary/50 transition-colors"
      >
        <Card.Header class="pb-3">
          <div class="flex items-center gap-3">
            <div class="bg-primary/10 text-primary shrink-0 rounded-lg p-2">
              <item.icon class="size-4" />
            </div>
            <Card.Title class="text-sm leading-tight font-semibold"
              >{item.title()}</Card.Title
            >
          </div>
        </Card.Header>
        <Card.Content class="text-muted-foreground text-xs leading-relaxed">
          {item.desc()}
        </Card.Content>
      </Card.Root>
    {/each}
  </section>

  <Separator />

  <!-- Benefits -->
  <section class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h3 class="font-sans text-2xl font-bold tracking-tight">
        {m.volunteer_benefits_title()}
      </h3>
      <p class="text-muted-foreground max-w-3xl text-sm leading-relaxed">
        {m.volunteer_benefits_subtitle()}
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      {#each benefits as item (item.title)}
        <Card.Root class="bg-card border-border/80 flex items-start gap-4 p-6">
          <div class="bg-primary/10 text-primary shrink-0 rounded-xl p-3">
            <item.icon class="size-6" />
          </div>
          <div class="flex flex-col gap-2">
            <h4 class="text-base leading-tight font-semibold">
              {item.title()}
            </h4>
            <p class="text-muted-foreground text-xs leading-relaxed">
              {item.desc()}
            </p>
          </div>
        </Card.Root>
      {/each}
    </div>
  </section>

  <Separator />

  <!-- Timelines & Calendar -->
  <section class="flex flex-col gap-8">
    <div class="flex flex-col gap-2">
      <h3 class="font-sans text-2xl font-bold tracking-tight">
        {m.volunteer_timeline_title()}
      </h3>
      <p class="text-muted-foreground text-sm">
        {m.volunteer_timeline_monthly_subtitle()}
      </p>
    </div>

    <!-- Weekly schedule -->
    <div class="flex flex-col gap-4">
      <h4 class="font-sans text-lg font-semibold">
        {m.volunteer_timeline_weekly_title()}
      </h4>
      <div
        class="border-border/80 bg-card divide-border/60 divide-y overflow-hidden rounded-2xl border"
      >
        {#each weeklySchedule as item (item.day + item.time)}
          <div class="grid grid-cols-1 gap-4 p-6 md:grid-cols-[140px_1fr]">
            <div>
              <div class="text-primary text-sm font-bold">{item.day}</div>
              <div class="text-muted-foreground text-xs">{item.time}</div>
            </div>
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center gap-2">
                <h5 class="text-sm leading-none font-semibold">
                  {item.title()}
                </h5>
                <Badge
                  variant="outline"
                  class="px-2 py-0.5 text-[10px] font-medium"
                  >{item.place}</Badge
                >
              </div>
              <p class="text-muted-foreground text-xs leading-relaxed">
                {item.desc()}
              </p>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Monthly timeline -->
    <div class="flex flex-col gap-4">
      <h4 class="font-sans text-lg font-semibold">Timeline</h4>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {#each months as month (month.name)}
          <Card.Root class="bg-card border-border/80 p-5">
            <div
              class="text-primary mb-2 text-xs font-bold tracking-wider uppercase"
            >
              {month.name}
            </div>
            <p class="text-muted-foreground text-xs leading-relaxed">
              {month.desc}
            </p>
          </Card.Root>
        {/each}
      </div>
    </div>

    <!-- Quarterly Events -->
    <div class="grid gap-6 md:grid-cols-2">
      <Card.Root class="bg-card border-border/80 flex flex-col gap-3 p-6">
        <div class="flex items-center gap-3">
          <div class="bg-primary/10 text-primary rounded-lg p-2">
            <Calendar class="size-5" />
          </div>
          <Card.Title class="text-lg font-semibold"
            >{m.volunteer_quarterly_geekend_title()}</Card.Title
          >
        </div>
        <p class="text-muted-foreground flex-1 text-xs leading-relaxed">
          {m.volunteer_quarterly_geekend_desc()}
        </p>
      </Card.Root>
      <Card.Root class="bg-card border-border/80 flex flex-col gap-3 p-6">
        <div class="flex items-center gap-3">
          <div class="bg-primary/10 text-primary rounded-lg p-2">
            <Hammer class="size-5" />
          </div>
          <Card.Title class="text-lg font-semibold"
            >{m.volunteer_quarterly_snickerboa_title()}</Card.Title
          >
        </div>
        <p class="text-muted-foreground flex-1 text-xs leading-relaxed">
          {m.volunteer_quarterly_snickerboa_desc()}
        </p>
      </Card.Root>
    </div>
  </section>
</div>
