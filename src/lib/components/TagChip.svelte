<script lang="ts">
  import type { Tag } from "@prisma/client";

  export let tag: Pick<Tag, "color" | "name"> | undefined = undefined;
</script>

{#if tag}
  <span
    class="badge badge-md relative cursor-pointer whitespace-nowrap text-xs"
    style="border-color: {tag.color || 'white'}"
  >
    <div
      class="absolute inset-0 opacity-10 transition-colors"
      style="background-color: {tag.color || 'white'}"
    />
    {tag.name}
  </span>
{/if}
