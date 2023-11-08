<script lang="ts">
  import type { Member } from "@prisma/client";
  export let member: Member;
  export let size: "sm" | "xl" = "sm";
</script>

{#if member.classProgramme && member.classYear}
  <span
    class="badge badge-outline
      {size === 'sm' ? 'badge-sm text-xs font-light' : 'badge-lg text-xl font-semibold'} 
      {member.classProgramme === 'C' ? 'badge-secondary' : 'badge-primary'} "
  >
    {member.classProgramme}{member.classYear?.toString().substring(2)}
  </span>
{/if}
