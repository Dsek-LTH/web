<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import ClassBadge from "$lib/components/ClassBadge.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";

  export let data;
  $: members = data.members;
  $: programme = $page.url.searchParams.get("classProgramme") ?? "D";
  $: year =
    $page.url.searchParams.get("classYear") ??
    new Date().getFullYear().toString();
</script>

<svelte:head>
  <title
    >{programme}
    {year} | D-sektionen</title
  >
</svelte:head>

<!-- classProgramme -->
<div class="mb-4 flex items-center gap-4">
  <span class="text-lg text-primary">D</span>
  <input
    class="toggle"
    class:[--tglbg-primary]={programme === "D"}
    class:[--tglbg-secondary]={programme === "C"}
    class:bg-primary={programme === "D"}
    class:bg-secondary={programme === "C"}
    class:hover:bg-primary={programme === "D"}
    class:hover:bg-secondary={programme === "C"}
    class:border-primary={programme === "D"}
    class:border-secondary={programme === "C"}
    type="checkbox"
    checked={programme === "C"}
    on:click={async () =>
      await goto(
        `/members/?classProgramme=${
          programme === "C" ? "D" : "C"
        }&classYear=${year}`,
      )}
  />
  <span class="text-lg text-secondary">C</span>
</div>

<!-- classYear -->
<Pagination
  count={programme === "D"
    ? new Date().getFullYear() - 1982 + 1
    : new Date().getFullYear() - 2001 + 1}
  fieldName="classYear"
  getPageName={(n) => (new Date().getFullYear() - n).toString()}
  getPageNumber={(n) =>
    parseInt((new Date().getFullYear() - parseInt(n)).toString())}
/>

<div class="my-4 flex items-center gap-4">
  <ClassBadge
    member={{
      classProgramme: programme,
      classYear: parseInt(year),
    }}
    size="xl"
  />
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
        class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left font-medium"
      >
        {getFullName(member)}
      </span>
    </a>
  {/each}
</div>
