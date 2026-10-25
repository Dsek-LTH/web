<script lang="ts">
  import { Label } from "$lib/components/ui/label/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import AuthorsField from "$lib/actic/AuthorsField.svelte";
  import CandidatesBuilder from "$lib/actic/CandidatesBuilder.svelte";
  import ResolutionsField from "$lib/actic/ResolutionsField.svelte";
  import { FIELD_BG } from "$lib/actic/fieldStyles";
  import { keyedLabel, type CandidateRow } from "$lib/actic/fields";
  import type { DocumentInput } from "$lib/actic/dsek";
  import * as m from "$paraglide/messages";
  import WriteShell from "../WriteShell.svelte";
  import BodyField from "../BodyField.svelte";
  import { Writer } from "../writer.svelte";

  // Deterministic ids so SSR and hydration produce the same list keys.
  let rowSeq = 0;
  function nextRowId(): string {
    return `nom-${rowSeq++}`;
  }

  let title = $state("");
  let meeting = $state("");
  let candidates = $state<CandidateRow[]>([
    {
      id: nextRowId(),
      nominees: [{ id: nextRowId(), name: "" }],
      stat: "0 -- 4",
    },
  ]);
  let statsEnabled = $state(false);

  const writer = new Writer({
    getInput: (): DocumentInput => ({
      ...writer.commonInput(),
      family: "nomination",
      title,
      meeting,
      authors: writer.authors,
      candidates: toCandidateGroups(candidates),
      statsEnabled,
      yrkanden: { leadIn: writer.leadIn, items: writer.yrkanden },
    }),
    applyFamilyDraft: (draft) => {
      title = draft.title;
      meeting = draft.meeting;
      candidates = (draft.candidates ?? []).map((c) => ({
        id: nextRowId(),
        position: c.position,
        nominees: c.nominees.map((n) => ({ id: nextRowId(), name: n.name })),
        stat: c.stat || "0 -- 4",
      }));
      statsEnabled = draft.statsEnabled ?? false;
    },
    buildFamilyDraft: () => ({
      title,
      meeting,
      candidates: candidates.map((c) => ({
        id: c.id,
        position: c.position,
        nominees: c.nominees.map((n) => ({ id: n.id, name: n.name })),
        stat: c.stat,
      })),
      statsEnabled,
    }),
  });

  function toCandidateGroups(rows: CandidateRow[]) {
    return rows.map((row) => ({
      position: keyedLabel(row.position, writer.lang === "en"),
      nominees: row.nominees.map((n) => n.name),
      stat: row.stat,
    }));
  }
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

  <div class="flex flex-col gap-2">
    <Label
      >{m.actic_field_candidates()}
      <span class="text-destructive">*</span></Label
    >
    <CandidatesBuilder bind:candidates bind:statsEnabled />
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
