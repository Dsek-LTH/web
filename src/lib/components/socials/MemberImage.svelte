<script lang="ts">
  import type { Member } from "@prisma/client";

  export let member: Pick<Member, "picturePath">;
</script>

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
  alt="Member avatar"
/>
