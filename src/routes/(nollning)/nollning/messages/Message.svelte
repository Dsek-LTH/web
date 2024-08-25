<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import type {
    Article,
    Author,
    CustomAuthor,
    Mandate,
    Member,
    Position,
  } from "@prisma/client";
  import dayjs from "dayjs";

  export let message: Article & {
    author: Author & {
      member: Member;
      mandate:
        | (Mandate & {
            position: Position;
          })
        | null;
      customAuthor: CustomAuthor | null;
    };
  };
  $: author = message.author;
  $: authorName =
    author.type === "Custom"
      ? (author.customAuthor?.name ?? "Staben")
      : `${author.member.firstName}${author.mandate?.position ? `, ${author.mandate?.position?.name}` : ""}`;
</script>

<article>
  <div class="mb-1 font-medium uppercase text-base-200">
    <!-- less than a week ago -->
    {dayjs(new Date(message.publishedAt ?? message.createdAt)).fromNow()}
    <!-- {#if dayjs(new Date()).diff(new Date(message.publishedAt), "day") < 7}
      {dayjs(new Date(message.publishedAt)).format("ddd HH:mm")}
    {:else}
      {dayjs(new Date(message.publishedAt)).format("DD MMM HH:mm")}
    {/if} -->
  </div>
  <div
    class="rounded-box rounded-tl-none border-2 border-base-200 p-4 md:rounded-tl-2xl"
  >
    <h2 class="text-base text-primary">{message.header}</h2>
    <h5 class="mb-2 font-medium text-neutral">{authorName}</h5>
    <p>
      <MarkdownBody body={message.body} class="leading-tight" />
    </p>
  </div>
</article>
