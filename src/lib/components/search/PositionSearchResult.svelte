<script lang="ts">
  import * as Command from "$lib/components/ui/command/index.js";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import type { PositionSearchReturnAttributes } from "$lib/search/searchTypes";
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import { getLocale } from "$paraglide/runtime";
  import { getPositionLink } from "$lib/utils/positions";
  const { data }: { data: PositionSearchReturnAttributes } = $props();
</script>

<Command.LinkItem
  class="flex flex-row justify-between"
  href={getPositionLink(data.dsekId)}
>
  <div class="flex flex-row items-center gap-2">
    <Avatar.Root>
      {#if data.roleLogoUrl}
        <img src={data.roleLogoUrl} alt="" class="size-full object-contain" />
      {:else}
        <CommitteeIcon committee={data.committee}></CommitteeIcon>
      {/if}
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
