<script lang="ts">
  import * as Command from "$lib/components/ui/command/index.js";
  import { getBadgeVariantFromProgramme } from "../ui/badge/badge.svelte";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import type { MemberSearchReturnAttributes } from "$lib/search/searchTypes";
  import MemberAvatar from "$lib/components/MemberAvatar.svelte";
  const { data }: { data: MemberSearchReturnAttributes } = $props();
</script>

<Command.LinkItem
  class="flex flex-row justify-between"
  href={`/members/${data.studentId}`}
  data-search-result
>
  <div class="flex flex-row items-center gap-2">
    <MemberAvatar member={data}></MemberAvatar>
    <div class="flex flex-col">
      <span class="font-medium">{`${data.fullName}`}</span>
      <span class="text-muted-foreground">
        {data.studentId}
      </span>
    </div>
  </div>
  <Badge variant={getBadgeVariantFromProgramme(data.classProgramme)}
    >{`${data.classProgramme}${data.classYear?.toString().slice(2)}`}</Badge
  >
</Command.LinkItem>
