<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar";

  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { getFullName } from "$lib/utils/client/member";
  import { twMerge } from "tailwind-merge";

  let {
    class: klass,
    member,
    customAuthor = null,
    position,
    type = "Member",
    links = true,
    lazy = false,
  }: {
    class?: string;
    member: Pick<
      ExtendedPrismaModel<"Member">,
      "firstName" | "lastName" | "nickname" | "studentId" | "picturePath"
    >;
    customAuthor: Pick<
      ExtendedPrismaModel<"CustomAuthor">,
      "name" | "imageUrl"
    > | null;
    type?: ExtendedPrismaModel<"Author">["type"];
    position: Pick<ExtendedPrismaModel<"Position">, "id" | "name"> | undefined;
    links?: boolean;
    lazy?: boolean;
  } = $props();
</script>

<div class={twMerge("flex flex-row items-center gap-2 p-1", klass)}>
  {#if type == "Custom"}
    <Avatar.Root class="relative">
      <Avatar.Image {lazy} src={customAuthor?.imageUrl} alt="Author image" />
      <Avatar.Fallback></Avatar.Fallback>
    </Avatar.Root>
  {:else}
    <a
      href="/members/{member.studentId}"
      tabindex={links ? 0 : -1}
      class="link transition-opacity hover:opacity-80 focus:opacity-80 {links
        ? ''
        : 'pointer-events-none'}"
    >
      <Avatar.Root class="relative">
        <Avatar.Image {lazy} src={member.picturePath} alt="Member image" />
        <Avatar.Fallback
          >{member.firstName && member.lastName
            ? member.firstName?.charAt(0) + member.lastName?.charAt(0)
            : "NN"}</Avatar.Fallback
        >
      </Avatar.Root>
    </a>
  {/if}

  <div class="flex flex-col">
    {#if type == "Custom" && customAuthor != null}
      <h6>
        {customAuthor.name}
      </h6>
    {:else}
      <a
        href="/members/{member.studentId}"
        tabindex={links ? 0 : -1}
        class="transition-opacity hover:opacity-80 focus:opacity-80"
        class:pointer-events-none={!links}
      >
        <h6 class="line-clamp-3 break-words">
          {getFullName(member)}
        </h6>
      </a>
    {/if}

    {#if (type !== "Custom" || customAuthor == null) && position}
      <a
        href="/positions/{position.id}"
        tabindex={links ? 0 : -1}
        class="text-muted-foreground hover:opacity-80 focus:opacity-80 {links
          ? ''
          : 'pointer-events-none'}"
      >
        {position.name}
      </a>
    {/if}
  </div>
</div>
