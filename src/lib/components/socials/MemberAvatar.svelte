<script lang="ts">
  import { preventDefault } from "svelte/legacy";

  import type { Member } from "@prisma/client";
  import { twMerge } from "tailwind-merge";

  // export let uniqueCode: string | null = null; // unused for now, might use for creating better unique "backup images" later
  interface Props {
    member?: Pick<Member, "picturePath"> | null;
    class?: string;
    children?: import("svelte").Snippet;
  }

  let { member = null, class: clazz = "", children }: Props = $props();
</script>

<div
  class={twMerge(
    "avatar aspect-square w-8 overflow-hidden rounded-full",
    clazz,
  )}
>
  <figure class="relative w-full">
    <img
      src={member?.picturePath || backupUrl}
      onerror={preventDefault((e) => {
        const imgElement = e.currentTarget;
        if (imgElement && "src" in imgElement && imgElement.src !== backupUrl) {
          imgElement.src = backupUrl;
        }
      })}
      alt=""
    />
    {@render children?.()}
  </figure>
</div>
