<script lang="ts">
  import { Label } from "$lib/components/ui/label/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import CommitteePicker from "$lib/actic/CommitteePicker.svelte";
  import { FIELD_BG } from "$lib/actic/fieldStyles";
  import type { DocumentInput, KeyedValue } from "$lib/actic/dsek";
  import * as m from "$paraglide/messages";
  import WriteShell from "../WriteShell.svelte";
  import BodyField from "../BodyField.svelte";
  import { Writer } from "../writer.svelte";

  let committee = $state<KeyedValue | undefined>(undefined);
  /** The plan year; null shows (and sends) the package default: next year. */
  let planYear = $state<number | null>(null);

  const writer = new Writer({
    getInput: (): DocumentInput => ({
      ...writer.commonInput(),
      family: "equal-treatment-plan",
      committee: committee ?? null,
      year: planYear ?? defaultPlanYear(),
      // The package still requires `meeting`, but it is being removed in the
      // next release, so it is no longer asked for in the form.
      meeting: "",
    }),
    applyFamilyDraft: (draft) => {
      committee = draft.committee;
      planYear = draft.year ?? null;
    },
    buildFamilyDraft: () => ({
      committee,
      year: planYear ?? defaultPlanYear(),
    }),
  });

  /** The package default plan year: the year after the current one. */
  function defaultPlanYear(): number {
    return new Date().getFullYear() + 1;
  }
</script>

<WriteShell {writer}>
  <div class="flex flex-wrap items-end gap-4">
    <div class="flex flex-1 flex-col gap-1.5">
      <Label for="committee"
        >{m.actic_field_committee()}
        <span class="text-destructive">*</span></Label
      >
      <CommitteePicker
        id="committee"
        bind:value={committee}
        placeholder={m.actic_field_committee_placeholder()}
      />
    </div>
    <div class="flex w-24 flex-col gap-1.5">
      <Label for="plan-year">{m.actic_field_year()}</Label>
      <Input
        id="plan-year"
        type="number"
        class={FIELD_BG}
        bind:value={planYear}
        placeholder={String(defaultPlanYear())}
      />
    </div>
  </div>

  <BodyField {writer} />
</WriteShell>
