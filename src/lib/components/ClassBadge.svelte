<script lang="ts">
  import type { Member } from "@prisma/client";
  import type { classProgrammes } from "../../routes/members/[studentId]/data";
  export let member: Member;
  export let size: "sm" | "xl" = "sm";
  const colors: Record<(typeof classProgrammes)[number]["id"], string> = {
    D: "badge-primary",
    C: "badge-secondary",
    "VR/AR": "badge-primary",
    E: "border-[#fafaf9] text-[#fafaf9]",
    BME: "border-[#fafaf9] text-[#fafaf9]",
    Dokt: "border-[#c0c0c0] text-[#c0c0c0]",
    "?": "border-gray-400 text-gray-400",
  };
</script>

{#if member.classProgramme && member.classYear}
  <span
    class="badge badge-outline
      {size === 'sm' ? 'badge-sm text-xs font-light' : 'badge-lg text-xl font-semibold'} 
      {colors[member.classProgramme] ?? 'badge-primary'}"
  >
    {member.classProgramme}{member.classYear?.toString().substring(2)}
  </span>
{/if}
