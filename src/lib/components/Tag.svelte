<script lang="ts">
  import type { Tag } from "@prisma/client";

  export let tag: Tag | undefined = undefined;
</script>

{#if tag}
  <span class="badge badge-md">
    {tag.name}
  </span>
{/if}
