<script lang="ts">
  import type { Member } from "@prisma/client";

  export let member: Pick<Member, "picturePath" | "classProgramme" | "classYear">;
  export let size: "sm" | "md" | "lg" | "xl" | null = "md";
  const sizeToWidth = {
    sm: "w-4",
    md: "w-8",
    lg: "w-12",
    xl: "w-32",
  };
  export let rounded = "rounded-full";
</script>

<div class="avatar">
  <div class="{size ? sizeToWidth[size] : 'w-full'} {rounded} ">
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
