<script lang="ts">
  import * as Command from "$lib/components/ui/command/index.js";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import type { CommitteeSearchReturnAttributes } from "$lib/search/searchTypes";
  import CommitteeIcon from "../images/CommitteeIcon.svelte";
  import { getLocale } from "$paraglide/runtime";
  const { data }: { data: CommitteeSearchReturnAttributes } = $props();
</script>

<Command.LinkItem
  class="flex flex-row justify-between"
  href={`/comittees/${data.shortName}`}
  data-search-result
>
  <div class="flex flex-row items-center gap-2">
    <Avatar.Root>
      <CommitteeIcon committee={data}></CommitteeIcon>
    </Avatar.Root>
    <div class="flex flex-col">
      <span class="font-medium"
        >{getLocale() === "sv" ? data.nameSv : data.nameEn}</span
      >
      <span class="text-muted-foreground">
        {getLocale() === "sv" ? data.descriptionSv : data.descriptionEn}
      </span>
    </div>
  </div>
</Command.LinkItem>
