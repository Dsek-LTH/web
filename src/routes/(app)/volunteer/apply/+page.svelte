<script lang="ts">
  import type { PageData } from "./$types";
  import * as m from "$paraglide/messages";
  import * as Card from "$lib/components/ui/card";
  import * as Tabs from "$lib/components/ui/tabs";
  import { Separator } from "$lib/components/ui/separator";
  import { Button } from "$lib/components/ui/button";
  import GuideCard from "../GuideCard.svelte";
  import ElectionCard from "$lib/components/ElectionCard.svelte";
  import Video from "@lucide/svelte/icons/video";
  import Users from "@lucide/svelte/icons/users";
  import FileText from "@lucide/svelte/icons/file-text";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import Gift from "@lucide/svelte/icons/gift";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import Coffee from "@lucide/svelte/icons/coffee";
  import Calendar from "@lucide/svelte/icons/calendar";
  import { resolve } from "$app/paths";

  let { data }: { data: PageData } = $props();

  const meetingSteps = [
    m.volunteer_apply_meeting_step1,
    m.volunteer_apply_meeting_step2,
    m.volunteer_apply_meeting_step3,
    m.volunteer_apply_meeting_step4,
    m.volunteer_apply_meeting_step5,
    m.volunteer_apply_meeting_step6,
    m.volunteer_apply_meeting_step7,
    m.volunteer_apply_meeting_step8,
    m.volunteer_apply_meeting_step9,
  ];

  const interviewSteps = [
    m.volunteer_apply_interview_step1,
    m.volunteer_apply_interview_step2,
    m.volunteer_apply_interview_step3,
    m.volunteer_apply_interview_step4,
    m.volunteer_apply_interview_step5,
    m.volunteer_apply_interview_step6,
    m.volunteer_apply_interview_step7,
    m.volunteer_apply_interview_step8,
  ];

  const formSteps = [
    m.volunteer_apply_form_step1,
    m.volunteer_apply_form_step2,
    m.volunteer_apply_form_step3,
    m.volunteer_apply_form_step4,
    m.volunteer_apply_form_step5,
  ];

  const alwaysItems = [
    m.volunteer_roles_always_item1,
    m.volunteer_roles_always_item2,
    m.volunteer_roles_always_item3,
    m.volunteer_roles_always_item4,
    m.volunteer_roles_always_item5,
    m.volunteer_roles_always_item6,
    m.volunteer_roles_always_item7,
  ];

  const htm1Items = [
    m.volunteer_roles_htm1_item1,
    m.volunteer_roles_htm1_item2,
    m.volunteer_roles_htm1_item3,
  ];

  const htmvalGroups = [
    {
      label: m.volunteer_roles_htmval_board_label,
      desc: m.volunteer_roles_htmval_board,
    },
    {
      label: m.volunteer_roles_htmval_vice_label,
      desc: m.volunteer_roles_htmval_vice,
    },
    {
      label: m.volunteer_roles_htmval_other_label,
      desc: m.volunteer_roles_htmval_other,
    },
  ] as const;

  // Committee names are proper nouns and identical in both locales.
  const committeeRoles = [
    { name: "Café", desc: m.volunteer_roles_comm_cafe },
    { name: "Källar", desc: m.volunteer_roles_comm_kallar },
    { name: "AktU", desc: m.volunteer_roles_comm_aktu },
    { name: "InfU", desc: m.volunteer_roles_comm_infu },
    { name: "Sexet", desc: m.volunteer_roles_comm_sexet },
    { name: "NollU", desc: m.volunteer_roles_comm_nollu },
    { name: "Framtid", desc: m.volunteer_roles_comm_future },
    { name: "CPU", desc: m.volunteer_roles_comm_cpu },
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
</script>

<div class="flex flex-col gap-10">
  <header class="flex flex-col gap-2">
    <h1>{m.volunteer_apply_title()}</h1>
    <p class="text-muted-foreground max-w-3xl text-base leading-relaxed">
      {m.volunteer_apply_subtitle()}
    </p>
  </header>

  <!-- How elections work overall -->
  <section class="flex flex-col gap-2">
    <h2>{m.volunteer_apply_process_title()}</h2>
    <p class="text-muted-foreground max-w-4xl text-base leading-relaxed">
      {m.volunteer_apply_process_desc()}
    </p>
  </section>

  <Separator />

  <!-- 1. Elections held at guild meetings -->
  <section class="flex flex-col gap-5">
    <h2>{m.volunteer_apply_meeting_title()}</h2>

    <ol class="flex flex-col gap-3">
      {#each meetingSteps as step, i (i)}
        <li class="text-muted-foreground flex gap-3 text-base leading-relaxed">
          <span
            class="bg-primary/15 text-primary mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          >
            {i + 1}
          </span>
          <span>{step()}</span>
        </li>
      {/each}
    </ol>

    <div
      class="border-border/80 bg-muted-background flex flex-col gap-2 rounded-xl border p-5"
    >
      <p class="text-muted-foreground text-base leading-relaxed">
        {m.volunteer_apply_meeting_footer()}
      </p>
      <p class="text-primary text-base leading-relaxed font-semibold">
        {m.volunteer_apply_meeting_note()}
      </p>
    </div>
  </section>

  <Separator />

  <!-- 2. Elections run by nomination committees -->
  <section class="flex flex-col gap-5">
    <div class="flex flex-col gap-2">
      <h2>{m.volunteer_apply_board_title()}</h2>
      <p class="text-muted-foreground max-w-4xl text-base leading-relaxed">
        {m.volunteer_apply_board_desc()}
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card.Root class="bg-card border-border/80 flex flex-col gap-4 p-6">
        <h3 class="flex items-center gap-2 text-lg font-semibold">
          <Users class="text-primary size-4" />
          <span>{m.volunteer_apply_interview_title()}</span>
        </h3>
        <ol class="flex flex-col gap-2.5">
          {#each interviewSteps as step, i (i)}
            <li
              class="text-muted-foreground flex gap-2.5 text-base leading-relaxed"
            >
              <span class="text-primary shrink-0 font-bold">{i + 1}.</span>
              <span>{step()}</span>
            </li>
          {/each}
        </ol>
      </Card.Root>

      <Card.Root class="bg-card border-border/80 flex flex-col gap-4 p-6">
        <h3 class="flex items-center gap-2 text-lg font-semibold">
          <FileText class="text-primary size-4" />
          <span>{m.volunteer_apply_form_title()}</span>
        </h3>
        <ol class="flex flex-col gap-2.5">
          {#each formSteps as step, i (i)}
            <li
              class="text-muted-foreground flex gap-2.5 text-base leading-relaxed"
            >
              <span class="text-primary shrink-0 font-bold">{i + 1}.</span>
              <span>{step()}</span>
            </li>
          {/each}
        </ol>
      </Card.Root>
    </div>
  </section>

  <Separator />

  <!-- 3. How to interview -->
  <section class="flex flex-col gap-5">
    <h2>{m.volunteer_apply_howto_title()}</h2>
    <Card.Root
      class="bg-muted-background border-border/80 flex flex-col items-center gap-6 p-6 sm:flex-row"
    >
      <div class="bg-primary/10 text-primary shrink-0 rounded-2xl p-4">
        <Video class="size-8" />
      </div>
      <p class="text-muted-foreground flex-1 text-base leading-relaxed">
        {m.volunteer_apply_howto_desc()}
      </p>
      <Button
        href="https://www.youtube.com/watch?v=7bB-VnYGuBw"
        target="_blank"
        rel="noreferrer"
        class="bg-primary hover:bg-rosa-hover flex shrink-0 items-center gap-2 text-white shadow-sm"
      >
        <span>{m.volunteer_apply_howto_btn()}</span>
        <ExternalLink class="size-4" />
      </Button>
    </Card.Root>
  </section>

  <Separator />

  <!-- 4. Which positions are open when -->
  <section class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h2>{m.volunteer_roles_title()}</h2>
      <p class="text-muted-foreground max-w-3xl text-base leading-relaxed">
        {m.volunteer_roles_subtitle()}
      </p>
    </div>

    <Tabs.Root value="always" class="w-full">
      <Tabs.List class="grid h-auto w-full grid-cols-2 gap-1 lg:grid-cols-4">
        <Tabs.Trigger value="always" class="py-2.5 text-sm">
          {m.volunteer_roles_always_title()}
        </Tabs.Trigger>
        <Tabs.Trigger value="htm1" class="py-2.5 text-sm">HTM-1</Tabs.Trigger>
        <Tabs.Trigger value="htmval" class="py-2.5 text-sm"
          >HTM-Val</Tabs.Trigger
        >
        <Tabs.Trigger value="committee" class="py-2.5 text-sm">
          {m.volunteer_roles_tab_committee()}
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="always" class="mt-4">
        <Card.Root class="bg-card border-border/80 flex flex-col gap-3 p-6">
          <h3 class="text-lg font-bold">
            {m.volunteer_roles_always_title()}
          </h3>
          <p class="text-muted-foreground text-base leading-relaxed">
            {m.volunteer_roles_always_desc()}
          </p>
          <ul class="text-muted-foreground list-disc space-y-2 pl-5 text-base">
            {#each alwaysItems as item, i (i)}
              <li>{item()}</li>
            {/each}
          </ul>
        </Card.Root>
      </Tabs.Content>

      <Tabs.Content value="htm1" class="mt-4">
        <Card.Root class="bg-card border-border/80 flex flex-col gap-3 p-6">
          <h3 class="text-lg font-bold">{m.volunteer_roles_htm1_title()}</h3>
          <ul class="text-muted-foreground list-disc space-y-2 pl-5 text-base">
            {#each htm1Items as item, i (i)}
              <li>{item()}</li>
            {/each}
          </ul>
        </Card.Root>
      </Tabs.Content>

      <Tabs.Content value="htmval" class="mt-4">
        <Card.Root class="bg-card border-border/80 flex flex-col gap-4 p-6">
          <div class="flex flex-col gap-2">
            <h3 class="text-lg font-bold">
              {m.volunteer_roles_htmval_heading()}
            </h3>
            <p class="text-muted-foreground text-base leading-relaxed">
              {m.volunteer_roles_htmval_desc()}
            </p>
          </div>
          {#each htmvalGroups as group (group.label)}
            <div class="flex flex-col gap-1.5">
              <h4 class="text-primary text-base font-semibold">
                {group.label()}
              </h4>
              <p class="text-muted-foreground text-base leading-relaxed">
                {group.desc()}
              </p>
            </div>
          {/each}
          <Separator class="my-1" />
          <div class="flex flex-col gap-1.5">
            <h4 class="text-primary text-base font-semibold">
              {m.volunteer_roles_htm2_label()}
            </h4>
            <p class="text-muted-foreground text-base leading-relaxed">
              {m.volunteer_roles_htm2_desc1()}
            </p>
            <p class="text-muted-foreground text-base leading-relaxed">
              {m.volunteer_roles_htm2_desc2()}
            </p>
          </div>
        </Card.Root>
      </Tabs.Content>

      <Tabs.Content value="committee" class="mt-4">
        <Card.Root class="bg-card border-border/80 flex flex-col gap-4 p-6">
          <div class="flex flex-col gap-2">
            <h3 class="text-lg font-bold">
              {m.volunteer_roles_comm_title()}
            </h3>
            <p class="text-muted-foreground text-base leading-relaxed">
              {m.volunteer_roles_comm_desc()}
            </p>
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {#each committeeRoles as role (role.name)}
              <div class="flex flex-col gap-1.5">
                <h4 class="text-primary text-base font-semibold">
                  {role.name}
                </h4>
                <p class="text-muted-foreground text-base leading-relaxed">
                  {role.desc()}
                </p>
              </div>
            {/each}
          </div>
        </Card.Root>
      </Tabs.Content>
    </Tabs.Root>
  </section>

  <Separator />

  <!-- 5. Open elections, straight from the database -->
  <section class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h2>{m.openElections()}</h2>
      <p class="text-muted-foreground max-w-3xl text-base leading-relaxed">
        {m.elections_description()}
      </p>
    </div>

    {#if data.openElections.length > 0}
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each data.openElections as election, index (election.id)}
          <ElectionCard {election} user={data.user} {index} />
        {/each}
      </div>
    {:else}
      <p
        class="text-muted-foreground rounded-xl border-2 border-dashed p-8 text-center text-base"
      >
        {m.volunteer_elections_empty()}
      </p>
    {/if}

    <Button
      href={resolve("/(app)/elections")}
      variant="outline"
      class="flex w-fit items-center gap-2"
    >
      <span>{m.volunteer_elections_all()}</span>
      <ArrowRight class="size-4" />
    </Button>
  </section>

  <Separator />

  <!-- 6. Perks -->
  <section class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h2>{m.volunteer_benefits_title()}</h2>
      <p class="text-muted-foreground max-w-3xl text-base leading-relaxed">
        {m.volunteer_benefits_subtitle()}
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      {#each benefits as item, index (item.title)}
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
