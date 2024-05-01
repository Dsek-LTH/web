<script lang="ts">
  import type { Member } from "@prisma/client";
  import { twMerge } from "tailwind-merge";

  export let member: Pick<Member, "picturePath"> | null = null;
  export let identficationHash: string | null = null;
  let clazz = "";
  export { clazz as class };

  $: backupUrl = identficationHash
    ? `https://gravatar.com/avatar/${identficationHash}?s=100&d=mp`
    : "https://gravatar.com/avatar?s=100&d=mp";
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
      on:error|preventDefault={(e) => {
        const imgElement = e.currentTarget;
        if (imgElement && "src" in imgElement && imgElement.src !== backupUrl) {
          imgElement.src = backupUrl;
        }
      }}
      alt=""
    />
    <slot />
  </figure>
</div>
