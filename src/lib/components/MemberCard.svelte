<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar";
  import { Badge } from "$lib/components/ui/badge";
  import { getBadgeVariantFromProgramme } from "$lib/components/ui/badge/badge.svelte";

  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { cn } from "$lib/utils";
  import { getFullName } from "$lib/utils/client/member";
  import type { Snippet } from "svelte";

  let {
    class: clazz,
    member,
    links = true,
    showId = false,
    showClass = false,
    children = undefined,
  }: {
    class?: string;
    member: Pick<
      ExtendedPrismaModel<"Member">,
      | "firstName"
      | "lastName"
      | "nickname"
      | "studentId"
      | "picturePath"
      | "classProgramme"
      | "classYear"
    >;
    type?: ExtendedPrismaModel<"Author">["type"];
    links?: boolean;
    showId?: boolean;
    showClass?: boolean;
    children?: Snippet;
  } = $props();
</script>

<div
  class={cn(
    "flex h-fit w-full min-w-0 flex-row items-center gap-2 rounded-sm border-[1px]",
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

  <div class="min-w-0 flex-1 text-left">
    <a
      href="/members/{member.studentId}"
      tabindex={links ? 0 : -1}
      class="block w-full text-left transition-opacity hover:opacity-80 focus:opacity-80"
      class:pointer-events-none={!links}
    >
      <h6
        class="overflow-wrap-anywhere m-0 text-left break-words whitespace-normal"
      >
        {getFullName(member)}
      </h6>
    </a>
  </div>

  {#if showId}
    <div class="ml-auto flex shrink-0 gap-2 text-left">
      <span class="text-muted-foreground text-left text-sm whitespace-normal">
        {member.studentId}
      </span>
    </div>
  {/if}

  {#if showClass}
    <div class="ml-0 shrink-0 gap-2">
      <Badge
        class="shrink-0"
        variant={getBadgeVariantFromProgramme(member.classProgramme)}
      >
        {`${member.classProgramme}${member.classYear?.toString().slice(2)}`}
      </Badge>
    </div>
  {/if}

  {#if children}
    <div class="ml-auto shrink-0">
      {@render children()}
    </div>
  {/if}
</div>
