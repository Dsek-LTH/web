<script lang="ts">
  import MemberImage from "$lib/components/socials/MemberImage.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import type { Author, CustomAuthor, Member, Position } from "@prisma/client";
  import { page } from "$app/stores";
  export let member: Member;
  export let customAuthor: CustomAuthor | undefined = undefined;
  export let position: Position | undefined = undefined;
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

<div class="flex flex-row items-center {sizeToGap[size]}, m-4">
  <div class="avatar">
    <div class="{sizeToWidth[size]} rounded-full">
      {#if type == "Custom" && customAuthor != null}
        <img
          src={customAuthor.imageUrl ?? "https://gravatar.com/avatar?s=100&d=mp"}
          alt={customAuthor.name}
          on:error={(e) => {
            const imgElement = e.currentTarget;
            if (
              imgElement &&
              "src" in imgElement &&
              imgElement.src !== "https://gravatar.com/avatar?s=100&d=mp"
            ) {
              imgElement.src = "https://gravatar.com/avatar?s=100&d=mp";
            }
          }}
        />
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
          {getFullName($page.data.session?.user, member)}
        </h3>
      </a>
      {#if position}
        <h3 class="text-sm font-thin">
          <a
            href="/positions/{position.id}"
            tabindex={links ? 0 : -1}
            class="link-primary link no-underline {links ? '' : 'pointer-events-none'}"
          >
            {position.name}
          </a>
        </h3>
      {/if}
    {/if}
  </div>
</div>
