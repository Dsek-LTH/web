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
        <img
          src={author.customAuthor.imageUrl ?? "https://gravatar.com/avatar?s=100&d=mp"}
          alt={author.customAuthor.name}
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
        <img
          src={author.member.picturePath ?? "https://gravatar.com/avatar?s=100&d=mp"}
          on:error|preventDefault={(e) => {
            const imgElement = e.currentTarget;
            if (
              imgElement &&
              "src" in imgElement &&
              imgElement.src !== "https://gravatar.com/avatar?s=100&d=mp"
            ) {
              imgElement.src = "https://gravatar.com/avatar?s=100&d=mp";
            }
          }}
          alt=""
        />
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
