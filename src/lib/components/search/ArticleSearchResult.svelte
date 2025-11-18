<script lang="ts">
  import * as Command from "$lib/components/ui/command/index.js";
  import * as Avatar from "$lib/components/ui/avatar/index.js";

  import type { ArticleSearchReturnAttributes } from "$lib/search/searchTypes";
  import { languageTag } from "$paraglide/runtime";
  const { data }: { data: ArticleSearchReturnAttributes } = $props();
  import dayjs from "dayjs";
</script>

<Command.LinkItem
  class="flex w-full flex-row justify-between"
  href={`/news/${data.slug}`}
  data-search-result
>
  <div class="flex w-full flex-col">
    <div class="flex w-full flex-row justify-between">
      <span class="line-clamp-1 font-medium">
        {languageTag() === "sv" ? data.headerSv : data.headerEn}
      </span>
      <div class="text-muted-foreground">
        {dayjs(data.publishedAt).format("YYYY-MM-DD")}
      </div>
    </div>

    <div class="flex flex-row items-center gap-1">
      <Avatar.Root class="size-4">
        <Avatar.Image src="https://picsum.photos/200" alt="profile picture" />
        <Avatar.Fallback>IK</Avatar.Fallback>
      </Avatar.Root>

      <span class="text-muted-foreground line-clamp-1"
        >{`${data.author.firstName} "${data.author.nickname}" ${data.author.lastName}`}</span
      >
    </div>
  </div>
</Command.LinkItem>
