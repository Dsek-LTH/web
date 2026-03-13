<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar";

  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { cn } from "$lib/utils";
  import { getFullName } from "$lib/utils/client/member";
  import type { Snippet } from "svelte";

  let {
    class: clazz,
    member,
    links = true,
    children = undefined,
  }: {
    class?: string;
    member: Pick<
      ExtendedPrismaModel<"Member">,
      "firstName" | "lastName" | "nickname" | "studentId" | "picturePath"
    >;
    type?: ExtendedPrismaModel<"Author">["type"];
    links?: boolean;
    children?: Snippet;
  } = $props();
</script>

<div
  class={cn(
    "flex h-fit flex-row items-center gap-2 rounded-sm border-[1px]",
    clazz,
  )}
>
  <a
    href="/members/{member.studentId}"
    tabindex={links ? 0 : -1}
    class="transition-opacity hover:opacity-80 focus:opacity-80 {links
      ? ''
      : 'pointer-events-none'}"
  >
    <Avatar.Root class="relative h-7 w-7">
      <Avatar.Image src={member.picturePath} alt="Member image" />
      <Avatar.Fallback class="text-xs"
        >{member.firstName && member.lastName
          ? member.firstName?.charAt(0) + member.lastName?.charAt(0)
          : "NN"}</Avatar.Fallback
      >
    </Avatar.Root>
  </a>

  <div class="flex flex-col">
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
  </div>

  {#if children}
    <div class="ml-auto">
      {@render children()}
    </div>
  {/if}
</div>
