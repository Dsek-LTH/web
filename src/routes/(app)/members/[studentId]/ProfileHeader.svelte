<script lang="ts">
  import type { Member } from "@prisma/client";
  import { getFullName } from "$lib/utils/client/member";
  import ClassBadge from "$lib/components/ClassBadge.svelte";
  import EditButton from "./EditButton.svelte";

  export let member: Member;
  export let isEditing: boolean;
  export let canEdit: boolean;
</script>

<div class="lg:flex-ow flex flex-col">
  <div class="flex flex-col">
    <h1 class="text-3xl font-bold">{getFullName(member)}</h1>
    <div class=" order-2 flex flex-row gap-2 text-nowrap lg:order-3">
      {member.studentId}
      <ClassBadge {member} size="xl" />
    </div>
  </div>
  <div class="flex flex-col md:hidden">
    {#if canEdit}
      <EditButton {isEditing} />
    {/if}
  </div>
</div>
