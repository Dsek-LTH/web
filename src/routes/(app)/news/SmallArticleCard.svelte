<script lang="ts">
  import DOMPurify from "isomorphic-dompurify";
  import { marked } from "marked";
  import { getFullName } from "$lib/utils/client/member";
  import type { Article } from "./articles";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";

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

  <div class="overflow-hidden p-8">
    <div class="flex-1">
      <a href={"news/" + article.slug} class="group">
        <h1 class="text-2xl font-bold group-hover:underline">
          {article.header}
        </h1>
        <div class="prose mb-8 mt-2 line-clamp-3 prose-headings:text-sm">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized client-side -->
          {@html marked(DOMPurify.sanitize(article.body))}
        </div>
      </a>
    </div>

    <div class="flex gap-4">
      <a href={"members/" + article.author.member.studentId}>
        <MemberAvatar class="size-10" member={article.author.member} />
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
          {article.createdAt.toLocaleDateString()}
        </p>
      </div>
    </div>
  </div>
</div>
