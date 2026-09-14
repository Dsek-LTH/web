<script lang="ts">
  import ProgramBadge from "$lib/components/member/ProgramBadge.svelte";
  import MemberCard from "$lib/components/MemberCard.svelte";
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { type PageData } from "./$types";
  import YearSelector from "$lib/components/YearSelector.svelte";
  import * as Select from "$lib/components/ui/select";
  import { page } from "$app/state";
  import { SvelteURLSearchParams } from "svelte/reactivity";

  let { data }: { data: PageData } = $props();
  let members = $derived(data.members);
  let program = $derived(data.program as keyof typeof programs);
  let year = $derived(data.year);

  const programYears = {
    all: 1982,
    D: 1982,
    C: 2001,
    "VR/AR": 2021,
  } as const;

  const programs = {
    all: m.members_all(),
    C: "C",
    D: "D",
    "VR/AR": "VR/AR",
  } as const;

  const getProgramLink = $derived((value: string) => {
    const searchParams = new SvelteURLSearchParams(page.url.searchParams);
    searchParams.set("program", value.toString());
    return `?${searchParams.toString()}`;
  });
</script>

<SetPageTitle title="{programs[program]} {year}" />

<div class="layout-container">
  <div class="flex flex-row items-center gap-2">
    <Select.Root type="single" name="classProgram" bind:value={program}>
      <Select.Trigger
        oninput={async (e) => {
          console.log(e);
          const searchParams = new SvelteURLSearchParams(page.url.searchParams);
          searchParams.set("year", e.currentTarget.value);
          return `?${searchParams.toString()}`;
        }}
        class="h-[inherit]! w-full py-2!"
        >{programs[program]}</Select.Trigger
      >
      <Select.Content>
        {#each Object.entries(programs) as classProgram (classProgram[0])}
          <a href={getProgramLink(classProgram[0])}
            ><Select.Item value={classProgram[0]}
              >{classProgram[1]}</Select.Item
            ></a
          >
        {/each}
      </Select.Content>
    </Select.Root>

    <YearSelector
      min={new Date().getFullYear() - programYears[program] + 1}
    />
  </div>

  <div class="my-4 flex items-center gap-4">
    {#if program !== "all"}
      <ProgramBadge
        member={{
          classProgramme: program,
          classYear: year,
        }}
        size="lg"
      />
    {/if}
    <p>
      {#if members.length === 0}
        {m.members_noMembers()}
      {:else if members.length > 1}
        {m.members_members({ x: members.length })}
      {:else}
        {m.members_oneMember()}
      {/if}
    </p>
  </div>

  <div
    class="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  >
    {#each members as member (member.id)}
      <MemberCard class="w-full" {member} showClass={program === "all"} />
    {/each}
  </div>
</div>
