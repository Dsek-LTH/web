<script lang="ts">
  import type { MemberDoorPolicies } from "$lib/utils/member";
  export let doorAccess: MemberDoorPolicies;
</script>

<div class="my-2 text-xl font-bold">Dörraccess</div>
<ul class="flex flex-col gap-2">
  {#each doorAccess as doorPolicy (doorPolicy.name + doorPolicy.startDate + doorPolicy.endDate)}
    <li
      class="flex items-center justify-between gap-4 rounded-lg bg-base-200 p-3"
    >
      <div class="flex flex-col">
        <span class="font-semibold">{doorPolicy.verboseName}</span>
        {#if doorPolicy.startDate != null || doorPolicy.endDate != null}
          <span class="text-nowrap text-[0.5rem] font-semibold opacity-50">
            {doorPolicy.startDate?.toLocaleDateString("sv-SE") ?? ""}
            -
            {doorPolicy.endDate?.toLocaleDateString("sv-SE") ?? ""}
          </span>
        {/if}
      </div>
      <div
        class="flex flex-1 flex-col items-stretch overflow-hidden text-right"
      >
        <div class="flex flex-col text-xs font-bold opacity-50">
          {#each doorPolicy.roles as role (role)}
            <span class="overflow-hidden text-ellipsis whitespace-nowrap"
              >{role}</span
            >
          {/each}
        </div>
      </div>
    </li>
  {/each}
</ul>
