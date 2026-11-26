<script lang="ts">
  import ProgrammeBadge from "$lib/components/member/ProgrammeBadge.svelte";
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
  let programme = $derived(data.programme as keyof typeof programmes);
  let year = $derived(data.year);

  const programmeYears = {
    all: 1982,
    D: 1982,
    C: 2001,
    "VR/AR": 2021,
  } as const;

  const programmes = {
    all: m.members_all(),
    C: "C",
    D: "D",
    "VR/AR": "VR/AR",
  } as const;

  const getProgrammeLink = $derived((value: string) => {
    const searchParams = new SvelteURLSearchParams(page.url.searchParams);
    searchParams.set("programme", value.toString());
    return `?${searchParams.toString()}`;
  });
</script>

<SetPageTitle title="{programmes[programme]} {year}" />

<div class="layout-container">
  <div class="flex flex-row items-center gap-2">
    <Select.Root type="single" name="classProgramme" bind:value={programme}>
      <Select.Trigger
        oninput={async (e) => {
          console.log(e);
          const searchParams = new SvelteURLSearchParams(page.url.searchParams);
          searchParams.set("year", e.currentTarget.value);
          return `?${searchParams.toString()}`;
        }}
        class="h-[inherit]! w-full py-2!"
        >{programmes[programme]}</Select.Trigger
      >
      <Select.Content>
        {#each Object.entries(programmes) as classProgramme (classProgramme[0])}
          <a href={getProgrammeLink(classProgramme[0])}
            ><Select.Item value={classProgramme[0]}
              >{classProgramme[1]}</Select.Item
            ></a
          >
        {/each}
      </Select.Content>
    </Select.Root>

    <YearSelector
      min={new Date().getFullYear() - programmeYears[programme] + 1}
    />
  </div>

  <div class="my-4 flex items-center gap-4">
    {#if programme !== "all"}
      <ProgrammeBadge
        member={{
          classProgramme: programme,
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
      <MemberCard class="w-full" {member} showClass={programme === "all"} />
    {/each}
  </div>
</div>
