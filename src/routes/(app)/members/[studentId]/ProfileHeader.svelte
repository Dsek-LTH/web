<script lang="ts">
  import ClassBadge from "$lib/components/ClassBadge.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import type { Member } from "@prisma/client";

  export let member: Member;
  export let email: string | undefined;
</script>

<div class="flex flex-col justify-between gap-4">
  <div class="flex flex-col gap-1">
    <h1 class="text-3xl font-bold">{getFullName(member)}</h1>
    <div
      class="order-2 flex flex-row items-center gap-2 text-nowrap lg:order-3"
    >
      <div>{member.studentId}</div>
      <ClassBadge {member} size="sm" />
    </div>
    {#if email}
      <div class="order-4 select-all break-all">
        {email}
      </div>
    {/if}
  </div>
  <div class="hidden sm:block md:hidden">
    <slot name="actions" />
  </div>
</div>
