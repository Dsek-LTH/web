<script lang="ts">
  import type { CustomAuthor } from "@prisma/client";

  interface Props {
    customAuthor: Pick<CustomAuthor, "imageUrl" | "name"> | null;
  }

  let { customAuthor }: Props = $props();
</script>

<img
  src={customAuthor?.imageUrl ?? "https://gravatar.com/avatar?s=100&d=mp"}
  alt={customAuthor?.name ?? "Unknown"}
  onerror={(e) => {
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
