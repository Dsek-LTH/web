<script lang="ts">
  import * as m from "$paraglide/messages";
  import { Separator } from "$lib/components/ui/separator";
  import { Badge } from "$lib/components/ui/badge";
  import GuideCard from "../GuideCard.svelte";
  import Timeline from "../Timeline.svelte";
  import CodeXml from "@lucide/svelte/icons/code-xml";
  import Camera from "@lucide/svelte/icons/camera";
  import Hammer from "@lucide/svelte/icons/hammer";
  import Coffee from "@lucide/svelte/icons/coffee";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import Users from "@lucide/svelte/icons/users";
  import Vote from "@lucide/svelte/icons/vote";
  import Calendar from "@lucide/svelte/icons/calendar";
  import { resolve } from "$app/paths";

  const committee = (shortName: string) =>
    resolve("/(app)/committees/[shortName]", { shortName });

  const involveWays = [
    {
      title: m.volunteer_involvement_cpu_title,
      icon: CodeXml,
      desc: m.volunteer_involvement_cpu_desc,
      href: committee("cpu"),
    },
    {
      title: m.volunteer_involvement_infu_title,
      icon: Camera,
      desc: m.volunteer_involvement_infu_desc,
      href: committee("infu"),
    },
    {
      title: m.volunteer_involvement_kallar_title,
      icon: Hammer,
      desc: m.volunteer_involvement_kallar_desc,
      href: committee("km"),
    },
    {
      title: m.volunteer_involvement_cafe_title,
      icon: Coffee,
      desc: m.volunteer_involvement_cafe_desc,
      href: committee("cafe"),
    },
    {
      title: m.volunteer_involvement_srd_title,
      icon: BookOpen,
      desc: m.volunteer_involvement_srd_desc,
      href: committee("srd"),
    },
    {
      title: m.volunteer_involvement_aktu_title,
      icon: Sparkles,
      desc: m.volunteer_involvement_aktu_desc,
      href: committee("aktu"),
    },
    {
      title: m.volunteer_involvement_sexet_title,
      icon: Users,
      desc: m.volunteer_involvement_sexet_desc,
      href: committee("sexm"),
    },
    {
      title: m.volunteer_involvement_run_title,
      icon: Vote,
      desc: m.volunteer_involvement_run_desc,
      href: resolve("/(app)/volunteer/apply"),
    },
  ] as const;

  const weeklySchedule = [
    {
      day: m.volunteer_day_mon,
      time: "17.15",
      title: m.volunteer_weekly_mon_title,
      place: "iDét",
      desc: m.volunteer_weekly_mon_desc,
    },
    {
      day: m.volunteer_day_tue,
      time: "12.15–13.00",
      title: m.volunteer_weekly_tue_board_title,
      place: "E:1124",
      desc: m.volunteer_weekly_tue_board_desc,
    },
    {
      day: m.volunteer_day_tue,
      time: "17.15",
      title: m.volunteer_weekly_tue_infu_title,
      place: "iDét",
      desc: m.volunteer_weekly_tue_infu_desc,
    },
    {
      day: m.volunteer_day_tue,
      time: "17.30–18.00",
      title: m.volunteer_weekly_tue_run_title,
      place: m.volunteer_weekly_place_outside(),
      desc: m.volunteer_weekly_tue_run_desc,
    },
    {
      day: m.volunteer_day_wed,
      time: "12.15–13.00",
      title: m.volunteer_weekly_wed_title,
      place: "E:1123",
      desc: m.volunteer_weekly_wed_desc,
    },
    {
      day: m.volunteer_day_thu,
      time: "12.15–13.00",
      title: m.volunteer_weekly_thu_aktu_title,
      place: "E:1123",
      desc: m.volunteer_weekly_thu_aktu_desc,
    },
    {
      day: m.volunteer_day_thu,
      time: "17.15",
      title: m.volunteer_weekly_thu_kallar_title,
      place: "iDét",
      desc: m.volunteer_weekly_thu_kallar_desc,
    },
    {
      day: m.volunteer_day_sun,
      time: "19.30",
      title: m.volunteer_weekly_dick_title,
      place: "Smörlyckan",
      desc: m.volunteer_weekly_dick_desc,
    },
  ] as const;

  // Hardcoded per academic year (läsår), not calendar year. Grouped by term.
  const academicYear = [
    {
      term: m.volunteer_timeline_ht(),
      months: [
        { name: m.volunteer_month_oct(), desc: m.volunteer_timeline_oct() },
        { name: m.volunteer_month_nov(), desc: m.volunteer_timeline_nov() },
        { name: m.volunteer_month_dec(), desc: m.volunteer_timeline_dec() },
      ],
    },
    {
      term: m.volunteer_timeline_vt(),
      months: [
        { name: m.volunteer_month_jan(), desc: m.volunteer_timeline_jan() },
        { name: m.volunteer_month_mar(), desc: m.volunteer_timeline_mar() },
        { name: m.volunteer_month_apr(), desc: m.volunteer_timeline_apr() },
        { name: m.volunteer_month_may(), desc: m.volunteer_timeline_may() },
      ],
    },
  ] as const;

  const bigEvents = [
    {
      title: m.volunteer_quarterly_geekend_title,
      icon: Calendar,
      desc: m.volunteer_quarterly_geekend_desc,
    },
    {
      title: m.volunteer_quarterly_snickerboa_title,
      icon: Hammer,
      desc: m.volunteer_quarterly_snickerboa_desc,
    },
  ] as const;
</script>

<div class="flex flex-col gap-10">
  <header class="flex flex-col gap-2">
    <h1>{m.volunteer_involvement_title()}</h1>
    <p class="text-muted-foreground text-md max-w-3xl leading-relaxed">
      {m.volunteer_involvement_subtitle()}
    </p>
  </header>

  <section class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
    {#each involveWays as item, index (item.title)}
      <GuideCard
        title={item.title()}
        description={item.desc()}
        icon={item.icon}
        href={item.href}
        {index}
      />
    {/each}
  </section>

  <Separator />

  <!-- Year-round on the guild -->
  <section class="flex flex-col gap-8">
    <div class="flex flex-col gap-2">
      <h2>{m.volunteer_timeline_title()}</h2>
      <p class="text-muted-foreground">
        {m.volunteer_timeline_monthly_subtitle()}
      </p>
    </div>

    <!-- Weekly schedule -->
    <div class="flex flex-col gap-4">
      <h3 class="text-lg font-semibold">
        {m.volunteer_timeline_weekly_title()}
      </h3>
      <div
        class="border-border/80 bg-card divide-border/60 divide-y overflow-hidden rounded-2xl border"
      >
        {#each weeklySchedule as item (item.title)}
          <div class="grid grid-cols-1 gap-4 p-6 md:grid-cols-[140px_1fr]">
            <div>
              <div class="text-primary text-sm font-bold">{item.day()}</div>
              <div class="text-muted-foreground text-xs">{item.time}</div>
            </div>
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center gap-2">
                <h4 class="text-sm leading-none font-semibold">
                  {item.title()}
                </h4>
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

    <!-- Academic-year timeline -->
    <div class="flex flex-col gap-4">
      <h3 class="text-lg font-semibold">
        {m.volunteer_timeline_yearly_title()}
      </h3>
      <Timeline terms={academicYear} />
    </div>
  </section>

  <Separator />

  <!-- Bigger events -->
  <section class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h2>{m.volunteer_bigevents_title()}</h2>
      <p class="text-muted-foreground max-w-3xl leading-relaxed">
        {m.volunteer_bigevents_subtitle()}
      </p>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
      {#each bigEvents as item, index (item.title)}
        <GuideCard
          title={item.title()}
          description={item.desc()}
          icon={item.icon}
          {index}
        />
      {/each}
    </div>
  </section>
</div>
