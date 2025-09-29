<script lang="ts">
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

  export let readme: Pick<ExtendedPrismaModel<"Readme">, "url">;
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
