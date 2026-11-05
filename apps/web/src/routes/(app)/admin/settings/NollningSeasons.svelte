<script lang="ts">
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { enhance } from "$app/forms";
  import { toast } from "$lib/stores/toast";
  import type { SubmitFunction } from "@sveltejs/kit";
  import * as m from "$paraglide/messages.js";

  type Season = {
    id: string;
    year: number;
    nollaStartAt: string;
    revealAt: string;
    endAt: string;
    organizingCommitteeId: string;
  };

  let {
    seasons,
    committees,
  }: {
    seasons: Season[];
    committees: Array<{ id: string; name: string }>;
  } = $props();

  const nextYear = $derived(
    Math.max(new Date().getFullYear(), ...seasons.map((s) => s.year + 1)),
  );

  // Shows the action's message either way: Go's reason when it refuses.
  const showResult: SubmitFunction =
    () =>
    async ({ result, update }) => {
      if (result.type === "success" || result.type === "failure") {
        const message = (
          result.data as
            | { form?: { message?: { message: string; type: string } } }
            | undefined
        )?.form?.message;
        if (message)
          toast(
            message.message,
            message.type === "error" ? "error" : "success",
          );
      }
      await update({ reset: false });
    };
</script>

{#snippet seasonForm(season: Season | undefined, year: number)}
  <form
    method="POST"
    action="?/saveSeason"
    use:enhance={showResult}
    class="flex flex-wrap items-end gap-4 py-3"
  >
    {#if season}
      <input type="hidden" name="id" value={season.id} />
    {/if}
    <div class="flex w-24 flex-col gap-1.5">
      <Label>{m.admin_settings_nollningYear()}</Label>
      <Input type="number" name="year" value={year} required />
    </div>
    <div class="flex flex-col gap-1.5">
      <Label>{m.admin_settings_nollningStart()}</Label>
      <Input
        type="datetime-local"
        name="nollaStartAt"
        value={season?.nollaStartAt ?? ""}
        required
      />
    </div>
    <div class="flex flex-col gap-1.5">
      <Label>{m.admin_settings_nollningReveal()}</Label>
      <Input
        type="datetime-local"
        name="revealAt"
        value={season?.revealAt ?? ""}
        required
      />
    </div>
    <div class="flex flex-col gap-1.5">
      <Label>{m.admin_settings_nollningEnd()}</Label>
      <Input
        type="datetime-local"
        name="endAt"
        value={season?.endAt ?? ""}
        required
      />
    </div>
    <div class="flex flex-col gap-1.5">
      <Label>{m.admin_settings_nollningCommittee()}</Label>
      <select
        name="organizingCommitteeId"
        value={season?.organizingCommitteeId ?? ""}
        class="border-input bg-background h-9 rounded-md border px-3 text-sm"
      >
        <option value="">{m.admin_settings_nollningCommitteeDefault()}</option>
        {#each committees as committee (committee.id)}
          <option value={committee.id}>{committee.name}</option>
        {/each}
      </select>
    </div>
    <Button type="submit" variant={season ? "outline" : undefined}>
      {m.admin_settings_save()}
    </Button>
  </form>
{/snippet}

<Card class="mb-6">
  <CardHeader>
    <CardTitle>{m.admin_settings_nollningSeasons()}</CardTitle>
    <p class="text-muted-foreground text-sm">
      {m.admin_settings_nollningTimezone()}
    </p>
  </CardHeader>
  <CardContent class="flex flex-col divide-y">
    <div>
      <h3 class="text-sm font-medium">
        {m.admin_settings_nollningNewSeason()}
      </h3>
      {@render seasonForm(undefined, nextYear)}
    </div>
    {#each seasons as season (season.id)}
      {@render seasonForm(season, season.year)}
    {/each}
  </CardContent>
</Card>
