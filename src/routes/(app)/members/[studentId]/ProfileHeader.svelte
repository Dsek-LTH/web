<script lang="ts">
  import ClassBadge from "$lib/components/ClassBadge.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import type { Member } from "@prisma/client";

  export let member: Member;
  export let email: string | undefined;
</script>

<div class="flex flex-col justify-between gap-4">
  <div class="flex flex-col gap-1">
    <div class="max-w-full">
      <h1
        class="line-clamp-3 break-words text-2xl font-bold sm:text-3xl"
        title={getFullName(member)}
      >
        {getFullName(member)}
      </h1>
    </div>

    <div
      class="order-2 flex flex-row items-center gap-2 text-nowrap lg:order-3"
    >
      <div class="min-w-0 truncate text-sm opacity-80 sm:text-base">
        {member.studentId}
      </div>
      <ClassBadge {member} size="sm" />
    </div>

    {#if email}
      <div
        class="order-4 select-all overflow-hidden break-all text-sm opacity-80 sm:text-base"
      >
        {email}
      </div>
    {/if}
  </div>

  <div class="hidden sm:block md:hidden">
    <slot name="actions" />
  </div>
</div>
