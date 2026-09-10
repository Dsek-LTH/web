<script lang="ts">
  import * as m from "$paraglide/messages";
  import * as Card from "$lib/components/ui/card";
  import { Separator } from "$lib/components/ui/separator";
  import GuideCard from "../GuideCard.svelte";
  import FileText from "@lucide/svelte/icons/file-text";
  import HelpCircle from "@lucide/svelte/icons/help-circle";
  import ListTodo from "@lucide/svelte/icons/list-todo";
  import Scale from "@lucide/svelte/icons/scale";
  import BookText from "@lucide/svelte/icons/book-text";
  import ShieldCheck from "@lucide/svelte/icons/shield-check";
  import PenLine from "@lucide/svelte/icons/pen-line";
  import { resolve } from "$app/paths";

  // Year is omitted on purpose — /documents defaults to the current year.
  const MEETING_DOCUMENTS = resolve("/(app)/documents") + "?type=guild-meeting";

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
    { title: m.volunteer_motions_tip1_label, desc: m.volunteer_motions_tip1 },
    { title: m.volunteer_motions_tip2_label, desc: m.volunteer_motions_tip2 },
    {
      title: m.volunteer_motions_tip3_label,
      desc: m.volunteer_motions_tip3_html,
    },
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

  const documents = [
    {
      title: m.volunteer_documents_handlingar_title,
      desc: m.volunteer_documents_handlingar_desc,
      icon: FileText,
      href: MEETING_DOCUMENTS,
      external: false,
    },
    {
      title: m.volunteer_documents_statutes_title,
      desc: m.volunteer_documents_statutes_desc,
      icon: Scale,
      href: resolve("/(app)/stadgar"),
      external: true,
    },
    {
      title: m.volunteer_documents_reglemente_title,
      desc: m.volunteer_documents_reglemente_desc,
      icon: BookText,
      href: resolve("/(app)/reglemente"),
      external: true,
    },
    {
      title: m.volunteer_documents_policies_title,
      desc: m.volunteer_documents_policies_desc,
      icon: ShieldCheck,
      // TODO: point at /documents/governing once that page is implemented.
      href: "https://github.com/Dsek-LTH/styrdokument",
      external: true,
    },
    {
      title: m.volunteer_documents_gerda_title,
      desc: m.volunteer_documents_gerda_desc,
      icon: PenLine,
      href: "https://gerda.dsek.se",
      external: true,
    },
  ] as const;
</script>

<div class="flex flex-col gap-10">
  <header class="flex flex-col gap-2">
    <h1>{m.volunteer_meetings_title()}</h1>
    <p class="text-muted-foreground text-md max-w-3xl leading-relaxed">
      {m.volunteer_meetings_subtitle()}
    </p>
  </header>

  <!-- The four guild meetings -->
  <section class="flex flex-col gap-5">
    <div class="flex flex-col gap-2">
      <h2>{m.volunteer_meetings_section_title()}</h2>
      <p class="text-muted-foreground max-w-4xl leading-relaxed">
        {m.volunteer_meetings_section_desc()}
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      {#each meetings as meeting, index (meeting.name)}
        <Card.Root
          class="bg-card border-border/80 animate-in fade-in slide-in-from-bottom-[0.5rem] fill-mode-backwards flex flex-col gap-2 p-6 duration-300"
          style="animation-delay:{index * 50}ms"
        >
          <h3 class="text-primary text-lg font-bold">{meeting.name()}</h3>
          <p class="text-muted-foreground flex-1 text-sm leading-relaxed">
            {meeting.desc()}
          </p>
        </Card.Root>
      {/each}
    </div>
  </section>

  <Separator />

  <!-- Motions -->
  <section class="flex flex-col gap-8">
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <div class="bg-primary/10 text-primary rounded-lg p-2">
          <FileText class="size-5" />
        </div>
        <h2>{m.volunteer_motions_title()}</h2>
      </div>
      <div
        class="text-muted-foreground max-w-4xl space-y-4 text-sm leading-relaxed"
      >
        <p>{m.volunteer_motions_desc1()}</p>
        <p>{m.volunteer_motions_desc2()}</p>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- translated string contains a mailto link -->
        <p>{@html m.volunteer_motions_desc3_html()}</p>
      </div>
    </div>

    <!-- Tips for writing motions -->
    <div
      class="border-border/80 bg-muted-background flex flex-col gap-6 rounded-2xl border p-6 md:p-8"
    >
      <div class="flex flex-col gap-1.5">
        <h3 class="text-lg font-bold">
          {m.volunteer_motions_tips_header()}
        </h3>
        <p class="text-muted-foreground text-xs italic">
          {m.volunteer_motions_tips_subheader()}
        </p>
      </div>

      <div class="grid gap-6 md:grid-cols-3">
        <!-- eslint-disable svelte/no-at-html-tags -- translated strings contain links -->
        {#each writingTips as tip (tip.title)}
          <div class="flex flex-col gap-2">
            <h4 class="text-primary text-sm font-semibold">{tip.title()}</h4>
            <p class="text-muted-foreground text-sm leading-relaxed">
              {@html tip.desc()}
            </p>
          </div>
        {/each}
        <!-- eslint-enable svelte/no-at-html-tags -->
      </div>

      <div class="border-border/60 mt-2 border-t pt-4">
        <h4 class="mb-2 flex items-center gap-2 text-sm font-semibold">
          <HelpCircle class="text-primary size-4" />
          <span>{m.volunteer_motions_general_tips_header()}</span>
        </h4>
        <ul class="text-muted-foreground list-disc space-y-2 pl-5 text-sm">
          {#each generalTips as tip, i (i)}
            <li>{tip()}</li>
          {/each}
        </ul>
        <p class="text-muted-foreground mt-4 text-sm">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -- translated string, no user input -->
          {@html m.volunteer_motions_general_footer_html()}
        </p>
      </div>
    </div>
  </section>

  <Separator />

  <!-- Governing documents & meeting records -->
  <section class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h2>{m.volunteer_documents_title()}</h2>
      <p class="text-muted-foreground max-w-3xl leading-relaxed">
        {m.volunteer_documents_subtitle()}
      </p>
    </div>

    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each documents as doc, index (doc.title)}
        <GuideCard
          title={doc.title()}
          description={doc.desc()}
          icon={doc.icon}
          href={doc.href}
          external={doc.external}
          cta={m.volunteer_documents_open()}
          {index}
        />
      {/each}
    </div>
  </section>

  <Separator />

  <!-- Tips for attending a meeting -->
  <section class="flex flex-col gap-6">
    <div class="flex items-center gap-3">
      <div class="bg-primary/10 text-primary rounded-lg p-2">
        <ListTodo class="size-5" />
      </div>
      <h2>{m.volunteer_meetings_tips_title()}</h2>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each meetingTips as tip, i (i)}
        <Card.Root
          class="bg-card border-border/80 animate-in fade-in slide-in-from-bottom-[0.5rem] fill-mode-backwards p-5 duration-300"
          style="animation-delay:{i * 50}ms"
        >
          <p class="text-muted-foreground text-sm leading-relaxed">
            {tip()}
          </p>
        </Card.Root>
      {/each}
    </div>
  </section>
</div>
