<script lang="ts">
  import type { FileData } from "$lib/files/fileHandler";
  import File from "./File.svelte";

  export let name: string;
  export let files: FileData[];
  // I do not use this because lexical ordering (default from minio) is preferred in my opinion
  // $: filesSortedByDate = [...files].sort((a, b) => {
  //   if (a.modDate && b.modDate) {
  //     return b.modDate.getTime() - a.modDate.getTime();
  //   } else if (a.modDate) {
  //     return -1;
  //   } else if (b.modDate) {
  //     return 1;
  //   } else {
  //     return 0;
  //   }
  // });
</script>

<section class="rounded-lg bg-base-200 p-4 pt-2 shadow">
  <h2 class="mb-2 text-lg font-bold">{name}</h2>
  <div class="grid grid-cols-4 gap-2">
    {#each files as file (file.id)}
      <File name={file.name} url={file.thumbnailUrl} />
    {/each}
  </div>
</section>
