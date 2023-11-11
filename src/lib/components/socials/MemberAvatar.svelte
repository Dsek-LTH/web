<script lang="ts">
  import type { Member } from "@prisma/client";
  import { twMerge } from "tailwind-merge";

  export let member: Pick<Member, "picturePath" | "classProgramme" | "classYear">;
  let clazz: string = "";
  export { clazz as class };
</script>

<div class={twMerge("avatar aspect-square w-8 overflow-hidden rounded-full", clazz)}>
  <figure class="relative w-full">
    <img
      src={member.picturePath || "https://gravatar.com/avatar?s=100&d=mp"}
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
    <slot />
  </figure>
</div>
