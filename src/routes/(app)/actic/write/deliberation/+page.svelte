<script lang="ts">
  import { Label } from "$lib/components/ui/label/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import AuthorsField from "$lib/actic/AuthorsField.svelte";
  import ResolutionsField from "$lib/actic/ResolutionsField.svelte";
  import { DOCUMENT_TYPES, type DeliberationTypeId, type DocumentInput } from "$lib/actic/dsek";
  import { FIELD_BG } from "$lib/actic/fieldStyles";
  import * as m from "$paraglide/messages";
  import WriteShell from "../WriteShell.svelte";
  import BodyField from "../BodyField.svelte";
  import { Writer } from "../writer.svelte";

  let deliberationType = $state<DeliberationTypeId>("motion");
  let title = $state("");
  let meeting = $state("");

  const familyTypes = DOCUMENT_TYPES.filter((t) => t.family === "deliberation");

  const writer = new Writer({
    getInput: (): DocumentInput => ({
      ...writer.commonInput(),
      family: "deliberation",
      type: deliberationType,
      title,
      meeting,
      authors: writer.authors,
      yrkanden: { leadIn: writer.leadIn, items: writer.yrkanden },
    }),
    applyFamilyDraft: (draft) => {
      if (draft.family === "deliberation") {
        deliberationType = draft.type as DeliberationTypeId;
      }
      title = draft.title;
      meeting = draft.meeting;
    },
    buildFamilyDraft: () => ({ title, meeting }),
  });

  // The landing page's "create" cards stash the chosen deliberation type in
  // sessionStorage (the family is in the route); read it once on the client.
  $effect(() => {
    if (writer.draftId) return;
    const stored = sessionStorage.getItem("actic.newType");
    if (!stored) return;
    sessionStorage.removeItem("actic.newType");
    const meta = DOCUMENT_TYPES.find((t) => t.id === stored);
    if (meta?.family === "deliberation") {
      deliberationType = meta.id as DeliberationTypeId;
    }
  });
</script>

<WriteShell {writer}>
  <div class="flex items-start gap-3">
    <div class="flex flex-1 flex-col gap-1.5">
      <Label for="title"
        >{m.actic_field_title()}
        <span class="text-destructive">*</span></Label
      >
      <Input
        id="title"
        class={FIELD_BG}
        bind:value={title}
        placeholder={m.actic_field_title_placeholder()}
        aria-invalid={writer.touched.title && !title.trim()}
        onblur={() => (writer.touched.title = true)}
      />
    </div>
    <div class="flex w-36 flex-col gap-1.5">
      <Label for="meeting"
        >{m.actic_field_meeting()}
        <span class="text-destructive">*</span></Label
      >
      <Input
        id="meeting"
        class={FIELD_BG}
        bind:value={meeting}
        placeholder={m.actic_field_meeting_placeholder()}
        aria-invalid={writer.touched.meeting && !meeting.trim()}
        onblur={() => (writer.touched.meeting = true)}
      />
    </div>
  </div>

  <!-- document type -->
  <div class="flex flex-wrap items-end gap-4">
    <div class="flex flex-col gap-1.5">
      <Label>{m.actic_field_type()}</Label>
      <div class="border-border flex overflow-hidden rounded-md border">
        {#each familyTypes as type (type.id)}
          <button
            type="button"
            class="px-3 py-1.5 text-sm whitespace-nowrap"
            class:bg-primary={deliberationType === type.id}
            class:text-primary-foreground={deliberationType === type.id}
            onclick={() => (deliberationType = type.id as DeliberationTypeId)}
          >
            {type.label()}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <BodyField {writer} />

  <ResolutionsField
    bind:leadIn={writer.leadIn}
    bind:items={writer.yrkanden}
    lang={writer.lang}
  />

  <AuthorsField
    bind:authors={writer.authors}
    error={writer.authorsError}
    ontouch={() => (writer.touched.authors = true)}
  />
</WriteShell>
