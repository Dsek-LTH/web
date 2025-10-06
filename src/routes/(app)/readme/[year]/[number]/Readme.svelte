<script lang="ts">
  import type { Readme } from "@prisma/client";
  export let readme: Readme;
</script>

<iframe
  src={readme.url}
  width="100%"
  height="780"
  scrolling="no"
  frameborder="0"
  allow="clipboard-write; autoplay; fullscreen"
  class="publuuflip"
  title="Readme of the month"
></iframe>
