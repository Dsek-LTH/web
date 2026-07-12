<script lang="ts">
  import * as m from "$paraglide/messages";
  import * as Card from "$lib/components/ui/card";
  import * as Tabs from "$lib/components/ui/tabs";
  import { Separator } from "$lib/components/ui/separator";
  import ClipboardCheck from "@lucide/svelte/icons/clipboard-check";
  import Video from "@lucide/svelte/icons/video";
  import Users from "@lucide/svelte/icons/users";
  import FileText from "@lucide/svelte/icons/file-text";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import { Button } from "$lib/components/ui/button";

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
</script>

<div class="flex flex-col gap-10">
  <!-- Header -->
  <div class="flex flex-col gap-2">
    <h2 class="font-sans text-3xl font-bold tracking-tight">
      {m.volunteer_apply_title()}
    </h2>
    <p class="text-muted-foreground text-md max-w-3xl leading-relaxed">
      {m.volunteer_apply_subtitle()}
    </p>
  </div>

  <!-- Guide intro -->
  <section class="flex flex-col gap-6">
    <div class="flex items-center gap-3">
      <div class="bg-primary/10 text-primary rounded-lg p-2">
        <ClipboardCheck class="size-5" />
      </div>
      <h3 class="font-sans text-2xl font-bold tracking-tight">
        {m.volunteer_apply_guide_title()}
      </h3>
    </div>
    <p class="text-muted-foreground max-w-4xl text-sm leading-relaxed">
      {m.volunteer_apply_guide_desc()}
    </p>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <!-- Steps at Meetings -->
      <Card.Root class="bg-card border-border/80 flex flex-col gap-4 p-6">
        <h4 class="text-primary font-sans text-base font-bold">
          {m.volunteer_apply_meeting_title()}
        </h4>
        <ol class="flex-1 space-y-3">
          {#each meetingSteps as step, i (i)}
            <li
              class="text-muted-foreground flex gap-3 text-xs leading-relaxed"
            >
              <span
                class="bg-primary/15 text-primary flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              >
                {i + 1}
              </span>
              <span>{step()}</span>
            </li>
          {/each}
        </ol>
        <p
          class="text-muted-foreground border-border/60 border-t pt-4 text-[11px] leading-relaxed"
        >
          {m.volunteer_apply_meeting_footer()}
        </p>
        <p class="text-primary text-[11px] leading-relaxed font-semibold">
          {m.volunteer_apply_meeting_note()}
        </p>
      </Card.Root>

      <!-- Steps by Nomination committees -->
      <Card.Root class="bg-card border-border/80 flex flex-col gap-4 p-6">
        <h4 class="text-primary font-sans text-base font-bold">
          {m.volunteer_apply_board_title()}
        </h4>
        <p class="text-muted-foreground text-xs leading-relaxed">
          {m.volunteer_apply_board_desc()}
        </p>

        <div class="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-2">
            <h5 class="flex items-center gap-1.5 text-xs font-semibold">
              <Users class="text-primary size-3.5" />
              <span>{m.volunteer_apply_interview_title()}</span>
            </h5>
            <ol class="space-y-1.5">
              {#each interviewSteps as step, i (i)}
                <li
                  class="text-muted-foreground flex gap-2 text-[10px] leading-relaxed"
                >
                  <span class="text-primary shrink-0 font-bold">{i + 1}.</span>
                  <span>{step()}</span>
                </li>
              {/each}
            </ol>
          </div>

          <div
            class="border-border/60 flex flex-col gap-2 border-t pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4"
          >
            <h5 class="flex items-center gap-1.5 text-xs font-semibold">
              <FileText class="text-primary size-3.5" />
              <span>{m.volunteer_apply_form_title()}</span>
            </h5>
            <ol class="space-y-1.5">
              {#each formSteps as step, i (i)}
                <li
                  class="text-muted-foreground flex gap-2 text-[10px] leading-relaxed"
                >
                  <span class="text-primary shrink-0 font-bold">{i + 1}.</span>
                  <span>{step()}</span>
                </li>
              {/each}
            </ol>
          </div>
        </div>
      </Card.Root>
    </div>

    <!-- Video walkthrough section -->
    <Card.Root
      class="bg-muted-background border-border/80 flex flex-col items-center gap-6 p-6 sm:flex-row"
    >
      <div class="bg-primary/10 text-primary shrink-0 rounded-2xl p-4">
        <Video class="size-8" />
      </div>
      <div class="flex flex-1 flex-col gap-2">
        <h4 class="font-sans text-base font-bold">
          {m.volunteer_apply_howto_title()}
        </h4>
        <p class="text-muted-foreground max-w-2xl text-xs leading-relaxed">
          {m.volunteer_apply_howto_desc()}
        </p>
      </div>
      <Button
        href="https://www.youtube.com/watch?v=7bB-VnYGuBw"
        target="_blank"
        rel="noreferrer"
        class="bg-primary hover:bg-rosa-hover flex items-center gap-2 text-white shadow-sm"
      >
        <span>{m.volunteer_apply_howto_btn()}</span>
        <ExternalLink class="size-4" />
      </Button>
    </Card.Root>
  </section>

  <Separator />

  <!-- Positions you can apply for -->
  <section class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h3 class="font-sans text-2xl font-bold tracking-tight">
        {m.volunteer_roles_title()}
      </h3>
      <p class="text-muted-foreground max-w-3xl text-sm leading-relaxed">
        {m.volunteer_roles_subtitle()}
      </p>
    </div>

    <Tabs.Root value="always" class="w-full">
      <Tabs.List class="grid h-auto w-full grid-cols-2 gap-1 lg:grid-cols-4">
        <Tabs.Trigger value="always" class="py-2.5 text-xs"
          >{m.volunteer_roles_always_title()}</Tabs.Trigger
        >
        <Tabs.Trigger value="htm1" class="py-2.5 text-xs">HTM-1</Tabs.Trigger>
        <Tabs.Trigger value="htmval" class="py-2.5 text-xs"
          >HTM-Val</Tabs.Trigger
        >
        <Tabs.Trigger value="committee" class="py-2.5 text-xs"
          >Utskottsval</Tabs.Trigger
        >
      </Tabs.List>

      <!-- Tab Content: Always Possible -->
      <Tabs.Content value="always" class="mt-4">
        <Card.Root class="bg-card border-border/80 p-6">
          <Card.Header class="px-0 pt-0 pb-3">
            <Card.Title class="text-base font-bold"
              >{m.volunteer_roles_always_title()}</Card.Title
            >
            <Card.Description class="text-xs"
              >{m.volunteer_roles_always_desc()}</Card.Description
            >
          </Card.Header>
          <Card.Content class="px-0 pb-0">
            <ul class="text-muted-foreground list-disc space-y-2 pl-5 text-xs">
              <li>{m.volunteer_roles_always_item1()}</li>
              <li>{m.volunteer_roles_always_item2()}</li>
              <li>{m.volunteer_roles_always_item3()}</li>
              <li>{m.volunteer_roles_always_item4()}</li>
              <li>{m.volunteer_roles_always_item5()}</li>
              <li>{m.volunteer_roles_always_item6()}</li>
              <li>{m.volunteer_roles_always_item7()}</li>
            </ul>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <!-- Tab Content: HTM-1 -->
      <Tabs.Content value="htm1" class="mt-4">
        <Card.Root class="bg-card border-border/80 p-6">
          <Card.Header class="px-0 pt-0 pb-3">
            <Card.Title class="text-base font-bold"
              >{m.volunteer_roles_htm1_title()}</Card.Title
            >
          </Card.Header>
          <Card.Content class="px-0 pb-0">
            <ul class="text-muted-foreground list-disc space-y-2 pl-5 text-xs">
              <li>{m.volunteer_roles_htm1_item1()}</li>
              <li>{m.volunteer_roles_htm1_item2()}</li>
              <li>{m.volunteer_roles_htm1_item3()}</li>
            </ul>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <!-- Tab Content: HTM-Val -->
      <Tabs.Content value="htmval" class="mt-4">
        <Card.Root class="bg-card border-border/80 p-6">
          <Card.Header class="px-0 pt-0 pb-3">
            <Card.Title class="text-base font-bold"
              >HTM-Val (Sektionsmötets val)</Card.Title
            >
            <Card.Description class="text-xs"
              >{m.volunteer_roles_htmval_desc()}</Card.Description
            >
          </Card.Header>
          <Card.Content class="flex flex-col gap-4 px-0 pb-0">
            <div class="flex flex-col gap-1.5">
              <h5 class="text-primary text-xs font-semibold">Styrelsen</h5>
              <p class="text-muted-foreground text-xs leading-relaxed">
                {m.volunteer_roles_htmval_board()}
              </p>
            </div>
            <div class="flex flex-col gap-1.5">
              <h5 class="text-primary text-xs font-semibold">
                Vice utskottsordförande
              </h5>
              <p class="text-muted-foreground text-xs leading-relaxed">
                {m.volunteer_roles_htmval_vice()}
              </p>
            </div>
            <div class="flex flex-col gap-1.5">
              <h5 class="text-primary text-xs font-semibold">Övriga poster</h5>
              <p class="text-muted-foreground text-xs leading-relaxed">
                {m.volunteer_roles_htmval_other()}
              </p>
            </div>
            <Separator class="my-2" />
            <div class="flex flex-col gap-1.5">
              <h5 class="text-primary text-xs font-semibold">HTM-2 & VTM</h5>
              <p class="text-muted-foreground text-xs leading-relaxed">
                {m.volunteer_roles_htm2_desc1()}
              </p>
              <p class="text-muted-foreground text-xs leading-relaxed">
                {m.volunteer_roles_htm2_desc2()}
              </p>
            </div>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <!-- Tab Content: Committee elections -->
      <Tabs.Content value="committee" class="mt-4">
        <Card.Root class="bg-card border-border/80 p-6">
          <Card.Header class="px-0 pt-0 pb-3">
            <Card.Title class="text-base font-bold"
              >{m.volunteer_roles_comm_title()}</Card.Title
            >
            <Card.Description class="text-xs"
              >{m.volunteer_roles_comm_desc()}</Card.Description
            >
          </Card.Header>
          <Card.Content class="flex flex-col gap-4 px-0 pb-0">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="flex flex-col gap-1.5">
                <h5 class="text-primary text-xs font-semibold">Café</h5>
                <p class="text-muted-foreground text-xs leading-relaxed">
                  {m.volunteer_roles_comm_cafe()}
                </p>
              </div>
              <div class="flex flex-col gap-1.5">
                <h5 class="text-primary text-xs font-semibold">Källar</h5>
                <p class="text-muted-foreground text-xs leading-relaxed">
                  {m.volunteer_roles_comm_kallar()}
                </p>
              </div>
              <div class="flex flex-col gap-1.5">
                <h5 class="text-primary text-xs font-semibold">AktU</h5>
                <p class="text-muted-foreground text-xs leading-relaxed">
                  {m.volunteer_roles_comm_aktu()}
                </p>
              </div>
              <div class="flex flex-col gap-1.5">
                <h5 class="text-primary text-xs font-semibold">InfU</h5>
                <p class="text-muted-foreground text-xs leading-relaxed">
                  {m.volunteer_roles_comm_infu()}
                </p>
              </div>
              <div class="flex flex-col gap-1.5">
                <h5 class="text-primary text-xs font-semibold">Sexet</h5>
                <p class="text-muted-foreground text-xs leading-relaxed">
                  {m.volunteer_roles_comm_sexet()}
                </p>
              </div>
              <div class="flex flex-col gap-1.5">
                <h5 class="text-primary text-xs font-semibold">NollU</h5>
                <p class="text-muted-foreground text-xs leading-relaxed">
                  {m.volunteer_roles_comm_nollu()}
                </p>
              </div>
              <div class="flex flex-col gap-1.5">
                <h5 class="text-primary text-xs font-semibold">Framtid</h5>
                <p class="text-muted-foreground text-xs leading-relaxed">
                  {m.volunteer_roles_comm_future()}
                </p>
              </div>
              <div class="flex flex-col gap-1.5">
                <h5 class="text-primary text-xs font-semibold">CPU</h5>
                <p class="text-muted-foreground text-xs leading-relaxed">
                  {m.volunteer_roles_comm_cpu()}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>
    </Tabs.Root>
  </section>
</div>
