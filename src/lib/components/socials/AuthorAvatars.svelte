<script lang="ts">
  import CustomAuthorImage from "$lib/components/socials/CustomAuthorImage.svelte";
  import DsekAvatar from "$lib/components/socials/DsekAvatar.svelte";
  import MemberImage from "$lib/components/socials/MemberImage.svelte";
  import type { ExpandedNotification } from "$lib/utils/notifications/group";

  export let authors: Array<NonNullable<ExpandedNotification["fromAuthor"]>>;
</script>

{#if authors.length <= 1}
  <div class="avatar">
    <div class="w-12 rounded-full">
      {#if authors[0] === undefined}
        <DsekAvatar />
      {:else}
        {@const author = authors[0]}
        {#if authors[0]?.type === "Custom"}
          <CustomAuthorImage customAuthor={author.customAuthor} />
        {:else}
          <MemberImage member={author.member} />
        {/if}
      {/if}
    </div>
  </div>
{:else}
  <div class="relative h-12 w-12">
    <div class="avatar absolute left-0 top-0">
      <div class="w-9 rounded-full">
        {#if authors[1]?.type === "Custom"}
          <CustomAuthorImage customAuthor={authors[1]?.customAuthor} />
        {:else}
          <MemberImage member={authors[1]?.member ?? { picturePath: null }} />
        {/if}
      </div>
    </div>
    <div class="avatar absolute left-3 top-3">
      <div class="w-9 rounded-full">
        {#if authors[0]?.type === "Custom"}
          <CustomAuthorImage customAuthor={authors[0]?.customAuthor} />
        {:else}
          <MemberImage member={authors[0]?.member ?? { picturePath: null }} />
        {/if}
      </div>
    </div>
  </div>
{/if}
