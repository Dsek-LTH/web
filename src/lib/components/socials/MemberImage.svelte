<script lang="ts">
  import { preventDefault } from "svelte/legacy";

  import type { Member } from "@prisma/client";

  interface Props {
    member: Pick<Member, "picturePath">;
  }

  let { member }: Props = $props();
</script>

<img
  src={member.picturePath || "https://gravatar.com/avatar?s=100&d=mp"}
  onerror={preventDefault((e) => {
    const imgElement = e.currentTarget;
    if (
      imgElement &&
      "src" in imgElement &&
      imgElement.src !== "https://gravatar.com/avatar?s=100&d=mp"
    ) {
      imgElement.src = "https://gravatar.com/avatar?s=100&d=mp";
    }
  })}
  alt="Member avatar"
/>
