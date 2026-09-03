<script lang="ts">
  import * as m from "$paraglide/messages";
  import * as Card from "$lib/components/ui/card";
  import { Separator } from "$lib/components/ui/separator";
  import FileText from "@lucide/svelte/icons/file-text";
  import HelpCircle from "@lucide/svelte/icons/help-circle";
  import ListTodo from "@lucide/svelte/icons/list-todo";
  import { resolve } from "$app/paths";

  const meetings = [
    {
      name: m.volunteer_meetings_htm1_title,
      desc: m.volunteer_meetings_htm1_desc,
    },
    {
      name: m.volunteer_meetings_htmval_title,
      desc: m.volunteer_meetings_htmval_desc,
    },
    {
      name: m.volunteer_meetings_htm2_title,
      desc: m.volunteer_meetings_htm2_desc,
    },
    {
      name: m.volunteer_meetings_vtm_title,
      desc: m.volunteer_meetings_vtm_desc,
    },
  ] as const;

  const writingTips = [
    { title: "Uppmaning", desc: m.volunteer_motions_tip1 },
    { title: "Visualisera ändringar", desc: m.volunteer_motions_tip2 },
    { title: "Hjälpverktyg (Gerda)", desc: m.volunteer_motions_tip3 },
  ] as const;

  const meetingTips = [
    m.volunteer_meetings_tips_list1,
    m.volunteer_meetings_tips_list2,
    m.volunteer_meetings_tips_list3,
    m.volunteer_meetings_tips_list4,
    m.volunteer_meetings_tips_list5,
  ] as const;

  const generalTips = [
    m.volunteer_motions_general_tips1,
    m.volunteer_motions_general_tips2,
    m.volunteer_motions_general_tips3,
  ] as const;
</script>

<div class="flex flex-col gap-10">
  <!-- Header -->
  <div class="flex flex-col gap-2">
    <h2 class="font-sans text-3xl font-bold tracking-tight">
      {m.volunteer_meetings_title()}
    </h2>
    <p class="text-muted-foreground text-md max-w-3xl leading-relaxed">
      {m.volunteer_meetings_subtitle()}
    </p>
  </div>

  <!-- 4 Meetings -->
  <section class="grid grid-cols-1 gap-6 md:grid-cols-2">
    {#each meetings as meeting (meeting.name)}
      <Card.Root class="bg-card border-border/80 flex flex-col gap-2 p-6">
        <h3 class="text-primary font-sans text-lg font-bold">
          {meeting.name()}
        </h3>
        <p class="text-muted-foreground flex-1 text-xs leading-relaxed">
          {meeting.desc()}
        </p>
      </Card.Root>
    {/each}
  </section>

  <Separator />

  <!-- Motions -->
  <section class="flex flex-col gap-8">
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <div class="bg-primary/10 text-primary rounded-lg p-2">
          <FileText class="size-5" />
        </div>
        <h3 class="font-sans text-2xl font-bold tracking-tight">
          {m.volunteer_motions_title()}
        </h3>
      </div>
      <div
        class="text-muted-foreground max-w-4xl space-y-4 text-sm leading-relaxed"
      >
        <p>{m.volunteer_motions_desc1()}</p>
        <p>{m.volunteer_motions_desc2()}</p>
        <p>
          Inför möten får alla medlemmar skicka in motioner om vad som helst
          till
          <a href="mailto:ordforande@dsek.se" class="link">ordforande@dsek.se</a
          >. Styrelsen läser igenom dem, ger ett officiellt svar och publicerar
          för hela sektionen i förväg. På mötet röstar sektionens medlemmar
          antingen igenom motionen eller inte, ibland med vissa ändringar.
        </p>
      </div>
    </div>

    <!-- Emma's tips -->
    <div
      class="border-border/80 bg-muted-background flex flex-col gap-6 rounded-2xl border p-6 md:p-8"
    >
      <div class="flex flex-col gap-1.5">
        <h4 class="font-sans text-lg font-bold">
          {m.volunteer_motions_tips_header()}
        </h4>
        <p class="text-muted-foreground text-xs italic">
          {m.volunteer_motions_tips_subheader()}
        </p>
      </div>

      <div class="grid gap-6 md:grid-cols-3">
        <!-- eslint-disable svelte/no-at-html-tags -->
        {#each writingTips as tip (tip.title)}
          <div class="flex flex-col gap-2">
            <h5 class="text-primary text-sm font-semibold">{tip.title}</h5>
            <p class="text-muted-foreground text-xs leading-relaxed">
              {@html tip.desc()}
            </p>
          </div>
        {/each}
        <!-- eslint-enable svelte/no-at-html-tags -->
      </div>

      <div class="border-border/60 mt-2 border-t pt-4">
        <h5 class="mb-2 flex items-center gap-2 text-sm font-semibold">
          <HelpCircle class="text-primary size-4" />
          <span>Generella tips</span>
        </h5>
        <ul class="text-muted-foreground list-disc space-y-2 pl-5 text-xs">
          {#each generalTips as tip, i (i)}
            <li>{tip()}</li>
          {/each}
        </ul>
        <p class="text-muted-foreground mt-4 text-xs">
          Sist men inte minst: din motion måste inte vara perfekt. Gör så bra du
          kan, fråga om hjälp. Det viktigaste är att du får lyfta vad du vill
          ändra på sektionen. Se
          <a
            href={resolve("/(app)/documents") + "?type=guild-meeting&year=2024"}
            target="_blank"
            rel="noreferrer"
            class="link">möteshandlingar 2024</a
          >
          för exempel.
        </p>
      </div>
    </div>
  </section>

  <Separator />

  <!-- Tips for meetings -->
  <section class="flex flex-col gap-6">
    <div class="flex items-center gap-3">
      <div class="bg-primary/10 text-primary rounded-lg p-2">
        <ListTodo class="size-5" />
      </div>
      <h3 class="font-sans text-2xl font-bold tracking-tight">
        {m.volunteer_meetings_tips_title()}
      </h3>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each meetingTips as tip, i (i)}
        <Card.Root
          class="bg-card border-border/80 relative overflow-hidden p-5"
        >
          <div
            class="text-primary/20 font-display absolute -top-2 -right-2 text-4xl font-bold select-none"
          >
            {i + 1}
          </div>
          <p
            class="text-muted-foreground relative z-10 pt-2 text-xs leading-relaxed"
          >
            {tip()}
          </p>
        </Card.Root>
      {/each}
    </div>
  </section>
</div>
