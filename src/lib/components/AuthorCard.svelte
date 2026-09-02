<script lang="ts">
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import * as Avatar from "$lib/components/ui/avatar";

  import { getFullName } from "$lib/utils/client/member";
  import { getPositionLink } from "$lib/utils/positions";
  import { twMerge } from "tailwind-merge";
  import type { components } from "$lib/api/schema";

  type Author = components["schemas"]["Author"];

  let {
    class: klass,
    author,
    links = true,
    lazy = false,
  }: {
    class?: string;
    // Matches the Go API's Author shape directly - flat `position`, not a
    // nested `mandate.position` - see backend/CLAUDE.md. Picked down to
    // just the fields used below, not the full Position/CustomAuthor
    // schemas, so this also accepts the article-form's lighter-weight
    // author-option shape (see $lib/news/schema.ts).
    author: {
      type: Author["type"];
      member: Author["member"];
      position?: Pick<NonNullable<Author["position"]>, "id" | "name">;
      customAuthor?: Pick<
        NonNullable<Author["customAuthor"]>,
        "name" | "imageUrl"
      >;
    };
    links?: boolean;
    lazy?: boolean;
  } = $props();
</script>

<div class={twMerge("flex flex-row items-center gap-2 p-1", klass)}>
  {#if author.type == "Custom"}
    <Avatar.Root class="relative">
      <Avatar.Image
        {lazy}
        src={author.customAuthor?.imageUrl}
        alt="Author image"
      />
    </Avatar.Root>
  {:else}
    <a
      href="/members/{author.member.studentId}"
      tabindex={links ? 0 : -1}
      class="transition-opacity hover:opacity-80 focus:opacity-80 {links
        ? ''
        : 'pointer-events-none'}"
    >
      <MemberAvatar {lazy} class="relative" member={author.member} />
    </a>
  {/if}

  <div class="flex flex-col">
    {#if author.type == "Custom" && author.customAuthor != null}
      <h6>
        {author.customAuthor.name}
      </h6>
    {:else}
      <a
        href="/members/{author.member.studentId}"
        tabindex={links ? 0 : -1}
        class="transition-opacity hover:opacity-80 focus:opacity-80"
        class:pointer-events-none={!links}
      >
        <h6 class="line-clamp-3 break-words">
          {getFullName(author.member)}
        </h6>
      </a>
    {/if}

    {#if (author.type !== "Custom" || author.customAuthor == null) && author.position}
      <a
        href={getPositionLink(author.position.id)}
        tabindex={links ? 0 : -1}
        class="text-muted-foreground hover:opacity-80 focus:opacity-80 {links
          ? ''
          : 'pointer-events-none'}"
      >
        {author.position.name}
      </a>
    {/if}
  </div>
</div>
