<script lang="ts">
  import CustomAuthorImage from "$lib/components/socials/CustomAuthorImage.svelte";
  import MemberImage from "$lib/components/socials/MemberImage.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import type { Author, CustomAuthor, Member, Position } from "@prisma/client";
  import { twMerge } from "tailwind-merge";

  let clazz = "";
  export { clazz as class };
  export let member: Pick<
    Member,
    "firstName" | "lastName" | "nickname" | "studentId" | "picturePath"
  >;
  export let customAuthor: Pick<CustomAuthor, "name" | "imageUrl"> | null =
    null;
  export let position: Pick<Position, "id" | "name"> | undefined = undefined;
  export let type: Author["type"] = "Member";
  export let size: "sm" | "md" | "lg" | "xl" = "lg";
  export let links = true;
  const sizeToWidth: Record<typeof size, string> = {
    sm: "w-4",
    md: "w-8",
    lg: "w-12",
    xl: "w-16",
  };
  const sizeToGap: Record<typeof size, string> = {
    sm: "gap-2",
    md: "gap-2",
    lg: "gap-3",
    xl: "gap-4",
  };
</script>

<div
  class={twMerge(`${sizeToGap[size]} flex grow flex-row items-center`, clazz)}
>
  <div class="avatar">
    <div class="{sizeToWidth[size]} m-2 rounded-full">
      {#if type == "Custom"}
        <CustomAuthorImage {customAuthor} />
      {:else}
        <a
          href="/members/{member.studentId}"
          tabindex={links ? 0 : -1}
          class="link transition-opacity hover:opacity-80 focus:opacity-80 {links
            ? ''
            : 'pointer-events-none'}"
        >
          <MemberImage {member} />
        </a>
      {/if}
    </div>
  </div>
  <div class="flex grow flex-col items-stretch">
    {#if type == "Custom" && customAuthor != null}
      <h3 class="text-{size}">
        {customAuthor.name}
      </h3>
    {:else}
      <a
        href="/members/{member.studentId}"
        tabindex={links ? 0 : -1}
        class="font-semibold transition-opacity hover:opacity-80 focus:opacity-80"
        class:pointer-events-none={!links}
      >
        <h3 class="text-{size} font-semibold">
          {getFullName(member)}
        </h3>
      </a>
    {/if}
    <div class="flex justify-between">
      {#if (type !== "Custom" || customAuthor == null) && position}
        <h3 class="text-sm font-thin">
          <a
            href="/positions/{position.id}"
            tabindex={links ? 0 : -1}
            class="link link-primary no-underline {links
              ? ''
              : 'pointer-events-none'}"
          >
            {position.name}
          </a>
        </h3>
      {:else}
        <div />
        <!-- for positioning the slot correctly -->
      {/if}
      <slot name="end" />
    </div>
  </div>
</div>
