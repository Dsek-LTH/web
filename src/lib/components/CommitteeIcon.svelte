<script lang="ts">
  import { getImageUrl } from "$lib/files/images";
  import type { Committee } from "@prisma/client";

  export let imageUrl: Committee["imageUrl"];
</script>

<img
  src={getImageUrl(imageUrl ?? "minio/material/committees/sigill.svg")}
  alt="Committee icon"
  class="aspect-square"
/>
