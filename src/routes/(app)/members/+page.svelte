<script lang="ts">
  import { goto } from "$lib/utils/redirect";
  import ClassBadge from "$lib/components/ClassBadge.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";

  export let data;
  $: members = data.members;
  $: programme = data.programme;
  $: year = data.year;

  const thisYear = new Date().getFullYear();

  function getProgrammeYear(programme: string): number {
    let count = 0;
    switch (programme) {
      case "D":
        count = thisYear - 1982 + 1;
        break;
      case "C":
        count = thisYear - 2001 + 1;
        break;
      case "VR/AR":
        count = thisYear - 2021 + 1;
        break;
      default:
        count = thisYear - 1982 + 1;
        break;
    }
    return count;
  }
</script>

<svelte:head>
  <title>
    {programme.toUpperCase()}
    {year} | D-sektionen
  </title>
</svelte:head>

<select
  class="select my-2 border-current"
  class:text-primary={programme === "D" || programme === "VR/AR"}
  class:text-secondary={programme === "C"}
  value={programme}
  on:change={async (e) =>
    await goto(`/members/?programme=${e.currentTarget.value}&year=${year}`)}
>
  <option value="all">Alla</option>
  <option class="text-primary" value="D">D</option>
  <option class="text-secondary" value="C">C</option>
  <option value="VR/AR">VR/AR</option>
</select>

<!-- classYear -->
<Pagination
  count={getProgrammeYear(programme)}
  fieldName="year"
  getPageName={(n) => (thisYear - n).toString()}
  getPageNumber={(n) => parseInt((thisYear - parseInt(n)).toString())}
/>

<div class="my-4 flex items-center gap-4">
  {#if programme !== "all"}
    <ClassBadge
      member={{
        classProgramme: programme,
        classYear: year,
      }}
      size="xl"
    />
  {/if}
  <p>
    {#if members.length === 0}
      Inga medlemmar hittades
    {:else if members.length > 1}
      {members.length} medlemmar
    {:else}
      1 medlem
    {/if}
  </p>
</div>

<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  {#each members as member}
    <a
      href="/members/{member.studentId}"
      class="btn btn-ghost w-full flex-nowrap justify-start normal-case"
    >
      <MemberAvatar {member} />
      <span
        class="flex flex-1 flex-wrap gap-2 overflow-hidden text-ellipsis text-left font-medium"
      >
        {getFullName(member)}
        {#if programme === "all"}
          <ClassBadge
            member={{
              classProgramme: member.classProgramme,
              classYear: member.classYear,
            }}
            size="sm"
          />
        {/if}
      </span>
    </a>
  {/each}
</div>
