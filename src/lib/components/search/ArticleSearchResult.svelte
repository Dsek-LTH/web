<script lang="ts">
  import * as Command from "$lib/components/ui/command/index.js";

  import type { ArticleSearchReturnAttributes } from "$lib/search/searchTypes";
  import { getLocale } from "$paraglide/runtime";
  import type { Locale } from "$paraglide/runtime";
  import dayjs from "dayjs";
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";

  let {
    data,
    language = getLocale(),
    isPreview = false,
  }: {
    data: ArticleSearchReturnAttributes;
    language?: Locale;
    isPreview?: boolean;
  } = $props();

  const header = $derived(
    language === "en" && data.headerEn ? data.headerEn : data.headerSv,
  );
</script>

{#snippet content()}
  <div class="flex w-full flex-col">
    <div class="flex w-full flex-row justify-between">
      <span class="line-clamp-1 font-medium">
        {header}
      </span>
      <div class="text-muted-foreground">
        {dayjs(data.publishedAt).format("YYYY-MM-DD")}
      </div>
    </div>

    <div class="flex flex-row items-center gap-1">
      <MemberAvatar member={data.author} class="size-4" />

      <span class="text-muted-foreground line-clamp-1"
        >{getFullName(data.author)}</span
      >
    </div>
  </div>
{/snippet}

{#if isPreview}
  <Command.Item class="flex w-full flex-row justify-between">
    {@render content()}
  </Command.Item>
{:else}
  <Command.LinkItem
    class="flex w-full flex-row justify-between"
    href={`/news/${data.slug}`}
  >
    {@render content()}
  </Command.LinkItem>
{/if}
