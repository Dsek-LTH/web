<script lang="ts">
  import type { Member, Ping } from "@prisma/client";
  import { getFullName } from "$lib/utils/client/member";
  import ClassBadge from "$lib/components/ClassBadge.svelte";
  import EditButton from "./EditButton.svelte";
  import PingButton from "./PingButton.svelte";

  export let member: Member;
  export let email: string;
  export let canPing: boolean;
  export let isEditing: boolean;
  export let canEdit: boolean;
  export let ping: Pick<
    Ping,
    "count" | "fromMemberId" | "fromSentAt" | "toSentAt"
  > | null;
</script>

<div class="lg:flex-ow flex flex-col">
  <div class="flex flex-col">
    <h1 class="text-3xl font-bold">{getFullName(member)}</h1>
    <div class=" order-2 flex flex-row gap-2 text-nowrap lg:order-3">
      {member.studentId}
      {email}
      <ClassBadge {member} size="xl" />
    </div>
  </div>
  <div class="flex flex-col md:hidden">
    {#if canEdit}
      <EditButton {isEditing} />
    {/if}
    {#if canPing}
      <PingButton {ping} />
    {/if}
  </div>
</div>
