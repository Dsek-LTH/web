<script lang="ts">
  import { Label } from "$lib/components/ui/label/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { FIELD_BG } from "$lib/actic/fieldStyles";
  import type { DocumentInput } from "$lib/actic/dsek";
  import * as m from "$paraglide/messages";
  import WriteShell from "../WriteShell.svelte";
  import BodyField from "../BodyField.svelte";
  import { Writer } from "../writer.svelte";

  /** The plan year, defaulting to (and sending) the package default: next year. */
  let planYear = $state<number | null>(defaultPlanYear());

  const writer = new Writer({
    getInput: (w): DocumentInput => ({
      ...w.commonInput(),
      family: "plan-of-operations",
      year: planYear ?? defaultPlanYear(),
    }),
    applyFamilyDraft: (draft) => {
      planYear = draft.year ?? defaultPlanYear();
    },
    buildFamilyDraft: () => ({
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
