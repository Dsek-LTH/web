<script lang="ts">
  import MemberImage from "$lib/components/socials/MemberImage.svelte";
  import { getFullName } from "$lib/utils/member";
  import type { Author, CustomAuthor, Member, Position } from "@prisma/client";

  export let member: Member;
  export let customAuthor: CustomAuthor | undefined = undefined;
  export let position: Position | undefined = undefined;
  export let type: Author["type"];
</script>

<div class="flex flex-row items-center gap-3">
  <div class="avatar">
    <div class="w-12 rounded-full">
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
        <MemberImage {member} />
      {/if}
    </div>
  </div>
  <div>
    {#if type == "Custom" && customAuthor != null}
      <h3 class="text-xl font-semibold">
        {customAuthor.name}
      </h3>
    {:else}
      <h3 class="text-xl font-semibold">
        {getFullName(member)}
      </h3>
      {#if position}
        <h3 class="text-sm font-thin text-primary">
          {position.name}
        </h3>
      {/if}
    {/if}
  </div>
</div>
