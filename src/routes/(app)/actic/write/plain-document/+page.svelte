<script lang="ts">
  import { Label } from "$lib/components/ui/label/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { FIELD_BG } from "$lib/actic/fieldStyles";
  import type { DocumentInput } from "$lib/actic/dsek";
  import * as m from "$paraglide/messages";
  import WriteShell from "../WriteShell.svelte";
  import BodyField from "../BodyField.svelte";
  import { Writer } from "../writer.svelte";

  let title = $state("");
  let meeting = $state("");
  let docType = $state("");
  let useCoverPage = $state(false);

  const writer = new Writer({
    getInput: (w): DocumentInput => ({
      ...w.commonInput(),
      family: "plain-document",
      title,
      meeting,
      docType,
      useCoverPage,
    }),
    applyFamilyDraft: (draft) => {
      title = draft.title;
      meeting = draft.meeting;
      docType = draft.docType ?? "";
      useCoverPage = draft.useCoverPage ?? false;
    },
    buildFamilyDraft: () => ({ title, meeting, docType, useCoverPage }),
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
        placeholder={m.actic_field_title_placeholder(
          {},
          { locale: writer.lang },
        )}
        aria-invalid={writer.touched.title && !title.trim()}
        onblur={() => (writer.touched.title = true)}
      />
    </div>
    <div class="flex w-36 flex-col gap-1.5">
      <Label for="meeting">{m.actic_field_meeting()}</Label>
      <Input
        id="meeting"
        class={FIELD_BG}
        bind:value={meeting}
        placeholder={m.actic_field_meeting_placeholder()}
      />
    </div>
  </div>

  <div class="flex flex-col gap-1.5">
    <Label for="doc-type">{m.actic_field_type()}</Label>
    <Input
      id="doc-type"
      class={FIELD_BG}
      bind:value={docType}
      placeholder={m.actic_field_docType_placeholder()}
    />
  </div>

  <label
    class={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm transition-colors ${
      useCoverPage ? "border-rosa-background bg-rosa-background/5" : ""
    }`}
  >
    <input
      type="checkbox"
      bind:checked={useCoverPage}
      class="accent-rosa-background mt-0.5"
    />
    <span class="flex flex-col gap-1">
      <span>{m.actic_field_coverPage()}</span>
      <span class="text-muted-foreground text-xs"
        >{m.actic_field_coverPage_description()}</span
      >
    </span>
  </label>

  <BodyField {writer} />
</WriteShell>
