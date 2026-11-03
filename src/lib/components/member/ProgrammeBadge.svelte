<script lang="ts">
  import type { components } from "$lib/api/schema";
  import { Badge } from "$lib/components/ui/badge";
  import type { BadgeSize } from "$lib/components/ui/badge/badge.svelte";

  let {
    member,
    size,
    class: klass,
  }: {
    member: Pick<
      components["schemas"]["Member"],
      "classProgramme" | "classYear"
    >;
    size?: BadgeSize;
    class?: string;
  } = $props();

  const programmeColors: Record<
    string,
    "rosa" | "lila" | "pistachio" | "outline"
  > = {
    D: "rosa",
    C: "lila",
    "VR/AR": "pistachio",
    E: "outline",
    BME: "outline",
    Dokt: "outline",
    "?": "rosa",
  };
</script>

<Badge
  class={klass}
  {size}
  variant={programmeColors[member.classProgramme ?? "?"] ?? "rosa"}
  >{(member.classProgramme ?? "?") +
    (member.classYear?.toString().slice(-2) ?? "??")}</Badge
>
