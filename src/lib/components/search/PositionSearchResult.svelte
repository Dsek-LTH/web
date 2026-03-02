<script lang="ts">
  import * as Command from "$lib/components/ui/command/index.js";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import type { PositionSearchReturnAttributes } from "$lib/search/searchTypes";
  import CommitteeIcon from "../images/CommitteeIcon.svelte";
  import { getLocale } from "$paraglide/runtime";
  const { data }: { data: PositionSearchReturnAttributes } = $props();
</script>

<Command.LinkItem
  class="flex flex-row justify-between"
  href={`/positions/${data.dsekId}`}
  data-search-result
>
  <div class="flex flex-row items-center gap-2">
    <Avatar.Root>
      <CommitteeIcon committee={data.committee}></CommitteeIcon>
    </Avatar.Root>
    <div class="flex flex-col">
      <span class="font-medium"
        >{getLocale() === "sv" ? data.nameSv : data.nameEn}</span
      >
      <span class="text-muted-foreground line-clamp-1">
        {getLocale() === "sv" ? data.descriptionSv : data.descriptionEn}
      </span>
    </div>
  </div>
</Command.LinkItem>
