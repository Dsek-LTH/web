<script lang="ts">
  import type { Member } from "@prisma/client";

  export let member: Pick<Member, "picturePath" | "classProgramme" | "classYear">;
  export let size: "xs" | "md" | "lg" | "xl" = "md";
  const sizeToWidth = {
    xs: "w-4",
    md: "w-8",
    lg: "w-12",
    xl: "w-16",
  };
</script>

<div class="avatar">
  <div class="{sizeToWidth[size]} rounded-full">
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
  </div>
</div>
