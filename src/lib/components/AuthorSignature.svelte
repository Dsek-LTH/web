<script lang="ts">
  import type { Prisma } from "@prisma/client";

  export let author: Prisma.AuthorGetPayload<{
    include: {
      member: true;
      mandate: {
        include: {
          position: true;
        };
      };
      customAuthor: true;
    };
  }>;
</script>

<div class="flex flex-row items-center gap-3">
  <div class="avatar">
    <div class="w-12 rounded-full">
      {#if author.type == "Custom" && author.customAuthor != null}
        <img src={author.customAuthor.imageUrl} alt={author.customAuthor.name} />
      {:else}
        <img src={author.member.picturePath} alt={author.member.firstName} />
      {/if}
    </div>
  </div>
  <div>
    {#if author.type == "Custom" && author.customAuthor != null}
      <h3 class="text-xl font-semibold">
        {author.customAuthor.name}
      </h3>
    {:else}
      <h3 class="text-xl font-semibold">
        {author.member.firstName + " " + author.member.lastName}
      </h3>
      {#if author.mandate?.position}
        <h3 class="text-sm font-thin text-primary">
          {author.mandate?.position.name}
        </h3>
      {/if}
    {/if}
  </div>
</div>
