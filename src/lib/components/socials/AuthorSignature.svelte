<script lang="ts">
  import CustomAuthorImage from "$lib/components/socials/CustomAuthorImage.svelte";
  import MemberImage from "$lib/components/socials/MemberImage.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import type { Author, CustomAuthor, Member, Position } from "@prisma/client";

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
  const sizeToWidth = {
    sm: "w-4",
    md: "w-8",
    lg: "w-12",
    xl: "w-16",
  };
  const sizeToGap = {
    sm: "gap-2",
    md: "gap-2",
    lg: "gap-3",
    xl: "gap-4",
  };
</script>

<div class="flex flex-row items-center {sizeToGap[size]}">
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
  <div>
    {#if type == "Custom" && customAuthor != null}
      <h3 class="text-{size} font-semibold">
        {customAuthor.name}
      </h3>
    {:else}
      <a
        href="/members/{member.studentId}"
        tabindex={links ? 0 : -1}
        class="transition-opacity hover:opacity-80 focus:opacity-80 {links
          ? ''
          : 'pointer-events-none'}"
      >
        <h3 class="text-{size} font-semibold">
          {getFullName(member)}
        </h3>
      </a>
      {#if position}
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
      {/if}
    {/if}
  </div>
</div>
