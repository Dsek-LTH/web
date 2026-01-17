<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar/index.js";

  import type { ArticleSearchReturnAttributes } from "$lib/search/searchTypes";
  import { languageTag } from "$paraglide/runtime";
  const { data }: { data: ArticleSearchReturnAttributes } = $props();
  import dayjs from "dayjs";
</script>

<a href={`/news/${data.slug}`}>
  <div
    class="flex w-full flex-row justify-between border-t-[1px] border-b-[1px] p-4"
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
          <Avatar.Image src={data.author.picturePath} alt="profile picture" />
          <Avatar.Fallback
            >{data.author.firstName && data.author.lastName
              ? data.author.firstName?.charAt(0) +
                data.author.lastName?.charAt(0)
              : "NN"}</Avatar.Fallback
          >
        </Avatar.Root>

        <span class="text-muted-foreground line-clamp-1"
          >{`${data.author.firstName} "${data.author.nickname}" ${data.author.lastName}`}</span
        >
      </div>
    </div>
  </div>
</a>
