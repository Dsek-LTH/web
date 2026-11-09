<script lang="ts">
  import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardAction,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { ChevronRight, Plus } from "@lucide/svelte";
  import { enhance } from "$app/forms";
  import { toast } from "$lib/stores/toast";
  import type { SubmitFunction } from "@sveltejs/kit";
  import * as m from "$paraglide/messages.js";
  import { toAppTime } from "$lib/utils/datetime";

  type Season = {
    id: string;
    year: number;
    nollaStartAt: string;
    revealAt: string;
    endAt: string;
    organizingCommitteeId: string;
    ended: boolean;
  };
  type Dates = Pick<Season, "nollaStartAt" | "revealAt" | "endAt">;

  let { seasons }: { seasons: Season[] } = $props();

  // Newest first: the current and coming seasons are what gets edited.
  const active = $derived(seasons.filter((s) => !s.ended));
  const ended = $derived(seasons.filter((s) => s.ended));

  let creating = $state(false);
  let newYear = $state<number | null>(null);

  // A new season starts out with the latest one's dates moved to its year
  // (the old fixed dates if there is none), so usually only the days need
  // adjusting; changing the year moves them along.
  const template = $derived<Dates>(
    seasons[0] ?? {
      nollaStartAt: "2000-08-01T00:00",
      revealAt: "2000-08-27T14:00",
      endAt: "2000-10-01T00:00",
    },
  );
  // While the year field is empty or half typed, the template's year.
  const inYear = (value: string, year: number | null) =>
    year && year >= 1000 ? `${year}${value.slice(4)}` : value;
  const newDates = $derived<Dates>({
    nollaStartAt: inYear(template.nollaStartAt, newYear),
    revealAt: inYear(template.revealAt, newYear),
    endAt: inYear(template.endAt, newYear),
  });

  // The year after the newest season, and never one whose season would
  // already be over by the template's dates.
  function startCreating() {
    const now = toAppTime(new Date()).format("YYYY-MM-DDTHH:mm");
    const thisYear = Number(now.slice(0, 4));
    newYear = Math.max(
      inYear(template.endAt, thisYear) > now ? thisYear : thisYear + 1,
      ...seasons.map((s) => s.year + 1),
    );
    creating = true;
  }

  // Shows the action's message either way: Go's reason when it refuses.
  const showResult =
    (onSuccess?: () => void): SubmitFunction =>
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
      if (result.type === "success") onSuccess?.();
      await update({ reset: false });
    };
</script>

{#snippet dateFields(dates: Dates | undefined)}
  <div class="flex flex-col gap-1.5">
    <Label>{m.admin_settings_nollningStart()}</Label>
    <Input
      type="datetime-local"
      name="nollaStartAt"
      value={dates?.nollaStartAt ?? ""}
      required
    />
  </div>
  <div class="flex flex-col gap-1.5">
    <Label>{m.admin_settings_nollningReveal()}</Label>
    <Input
      type="datetime-local"
      name="revealAt"
      value={dates?.revealAt ?? ""}
      required
    />
  </div>
  <div class="flex flex-col gap-1.5">
    <Label>{m.admin_settings_nollningEnd()}</Label>
    <Input
      type="datetime-local"
      name="endAt"
      value={dates?.endAt ?? ""}
      required
    />
  </div>
{/snippet}

{#snippet seasonForm(season: Season)}
  <form
    method="POST"
    action="?/saveSeason"
    use:enhance={showResult()}
    class="flex flex-wrap items-end gap-4 py-3"
  >
    <input type="hidden" name="id" value={season.id} />
    <input
      type="hidden"
      name="organizingCommitteeId"
      value={season.organizingCommitteeId}
    />
    <div class="flex w-24 flex-col gap-1.5">
      <Label>{m.admin_settings_nollningYear()}</Label>
      <Input type="number" name="year" value={season.year} required />
    </div>
    {@render dateFields(season)}
    <Button type="submit" variant="outline">
      {m.admin_settings_save()}
    </Button>
  </form>
{/snippet}

<Card class="mb-6">
  <CardHeader>
    <CardTitle>{m.admin_settings_nollningSeasons()}</CardTitle>
    <CardDescription>{m.admin_settings_nollningTimezone()}</CardDescription>
    {#if !creating}
      <CardAction>
        <Button onclick={startCreating}>
          <Plus />
          {m.admin_settings_nollningNewSeason()}
        </Button>
      </CardAction>
    {/if}
  </CardHeader>
  <CardContent class="flex flex-col gap-2">
    {#if creating}
      <!-- No committee: Go makes it nollu's. -->
      <form
        method="POST"
        action="?/saveSeason"
        use:enhance={showResult(() => (creating = false))}
        class="bg-muted/40 flex flex-col gap-3 rounded-md border p-4"
      >
        <h3 class="text-sm font-medium">
          {m.admin_settings_nollningNewSeason()}
        </h3>
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex w-24 flex-col gap-1.5">
            <Label>{m.admin_settings_nollningYear()}</Label>
            <Input type="number" name="year" bind:value={newYear} required />
          </div>
          {@render dateFields(newDates)}
        </div>
        <div class="flex gap-2">
          <Button type="submit">{m.admin_settings_nollningCreate()}</Button>
          <Button variant="ghost" onclick={() => (creating = false)}>
            {m.cancel()}
          </Button>
        </div>
      </form>
    {/if}

    {#if active.length > 0}
      <div class="flex flex-col divide-y">
        {#each active as season (season.id)}
          {@render seasonForm(season)}
        {/each}
      </div>
    {:else if !creating}
      <p class="text-muted-foreground text-sm">
        {m.admin_settings_nollningNoActiveSeason()}
      </p>
    {/if}

    {#if ended.length > 0}
      <details class="group">
        <summary
          class="text-muted-foreground hover:text-foreground flex cursor-pointer list-none items-center gap-1 py-2 text-sm"
        >
          <ChevronRight
            class="size-4 transition-transform group-open:rotate-90"
          />
          {m.admin_settings_nollningEndedSeasons({ count: ended.length })}
        </summary>
        <div class="flex flex-col divide-y">
          {#each ended as season (season.id)}
            {@render seasonForm(season)}
          {/each}
        </div>
      </details>
    {/if}
  </CardContent>
</Card>
