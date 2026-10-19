<script lang="ts">
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import MemberCard from "$lib/components/MemberCard.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages.js";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import { page } from "$app/state";
  import {
    dateToSemester,
    semesterTerm,
    semesterYear,
    parseSemesterFromString,
    type Semester,
  } from "$lib/utils/semesters";

  let { data } = $props();

  let semester = $derived.by((): Semester => {
    const param = page.url.searchParams.get("semester");
    if (!param) return dateToSemester(new Date());
    try {
      return parseSemesterFromString(param, () => new Error("invalid"));
    } catch {
      return dateToSemester(new Date());
    }
  });

  const semesterToString = (s: Semester) =>
    `${semesterTerm(s)} ${semesterYear(s)}`;

  function semesterHref(s: Semester) {
    const url = new URL(page.url);
    url.searchParams.set("semester", semesterToString(s));
    return `${url.pathname}${url.search}`;
  }
</script>

<SetPageTitle title={m.medals_pageTitle()} />

<div class="mx-auto w-full max-w-5xl px-4 py-8">
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-3xl font-bold">{m.medals_pageTitle()}</h1>
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        href={semesterHref(semester - 1)}
        aria-label={m.medals_previousSemester()}
      >
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <span class="min-w-20 text-center font-medium">
        {semesterToString(semester)}
      </span>
      <Button
        variant="outline"
        size="icon"
        href={semesterHref(semester + 1)}
        aria-label={m.medals_nextSemester()}
      >
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>
  </div>

  {#if data.recipients.length === 0}
    <p class="text-muted-foreground">{m.medals_noRecipients()}</p>
  {:else}
    <div class="flex flex-col gap-6">
      {#each data.recipients as group (group.medal)}
        <Card>
          <CardHeader>
            <CardTitle>{group.medal}</CardTitle>
          </CardHeader>
          <CardContent class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {#each group.recipients as member (member.studentId)}
              <MemberCard {member} />
            {/each}
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}
</div>
