<script lang="ts">
  import DOMPurify from "isomorphic-dompurify";
  import { marked } from "marked";
  import { getFullName } from "$lib/utils/client/member";
  import type { Article } from "./articles";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import dayjs from "dayjs";
  import { goto } from "$app/navigation";
  export let article: Article;
</script>

<div
  class="row-span-2 grid grid-rows-subgrid gap-0 overflow-hidden rounded-xl bg-base-200"
>
  <div class="flex justify-between gap-4 bg-base-300 p-4">
    <div class="flex flex-wrap gap-2">
      {#each article.tags as tag}
        <span class="badge text-xs text-neutral-400">{tag.name}</span>
      {/each}
    </div>
  </div>

  <div class="flex flex-col overflow-hidden p-8">
    <div class="flex-1">
      <button
        on:click={() => goto("news/" + article.slug)}
        class="group text-start"
      >
        <h1 class="text-2xl font-bold group-hover:underline">
          {article.header}
        </h1>
        <div class="prose mb-8 mt-2 line-clamp-3 prose-headings:text-sm">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized client-side -->
          {@html marked(DOMPurify.sanitize(article.body))}
        </div>
      </button>
    </div>

    <div class="flex gap-4">
      <a href={"members/" + article.author.member.studentId}>
        <MemberAvatar
          class="size-10 hover:opacity-60"
          member={article.author.member}
        />
      </a>
      <div class="flex w-full items-center justify-between gap-4">
        <div>
          <a href={"members/" + article.author.member.studentId}>
            <h2 class="text-sm font-semibold text-primary hover:underline">
              {getFullName(article.author.member)}
            </h2>
          </a>
          {#if article.author.mandate}
            <a href={"positions/" + article.author.mandate.position.id}>
              <p class="my-1 text-xs font-light hover:underline">
                {article.author.mandate.position.name}
              </p>
            </a>
          {/if}
        </div>
        <p class="my-1 self-end text-xs font-light text-neutral-600">
          {#if dayjs(article.createdAt).diff(dayjs(), "week") < -1}
            {dayjs(article.createdAt).format("YYYY-MM-DD")}
          {:else}
            {dayjs(article.createdAt).fromNow()}
          {/if}
        </p>
      </div>
    </div>
  </div>
</div>
