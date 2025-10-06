<script lang="ts">
  import type { programmes } from "$lib/utils/programmes";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  export let member: Pick<
    ExtendedPrismaModel<"Member">,
    "classProgramme" | "classYear"
  >;
  export let size: "sm" | "xl" = "sm";

  // Couldn't make TS happy with colors[member.classProgramme] without
  // Record<string, string>. Should instead be the type it satisfies.
  const colors: Record<string, string> = {
    D: "badge-primary",
    C: "badge-secondary",
    "VR/AR": "badge-primary",
    E: "border-[#fafaf9] text-[#fafaf9]",
    BME: "border-[#fafaf9] text-[#fafaf9]",
    Dokt: "border-[#c0c0c0] text-[#c0c0c0]",
    "?": "border-gray-400 text-gray-400",
  } satisfies Record<(typeof programmes)[number]["id"], string>;
</script>

{#if member.classProgramme && member.classYear}
  <a href="/members/?programme={member.classProgramme}&year={member.classYear}">
    <span
      class="badge badge-outline
      {size === 'sm'
        ? 'badge-sm text-xs font-light'
        : 'badge-lg text-xl font-semibold'} 
      {colors[member.classProgramme] ?? colors['?']}"
    >
      {member.classProgramme}{member.classYear?.toString().substring(2)}
    </span>
  </a>
{/if}
