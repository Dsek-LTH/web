<script lang="ts">
  import { page } from "$app/stores";
  import type { FileData } from "$lib/files/fileHandler";
  import apiNames from "$lib/utils/apiNames";
  import DeleteFileForm from "./DeleteFileForm.svelte";
  import File from "./File.svelte";

  export let name: string;
  export let files: FileData[];
  export let isEditing: boolean = false;
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
      <div class="flex gap-1">
        <File name={file.name} url={file.thumbnailUrl} full />
        {#if $page.data.accessPolicies.includes(apiNames.FILES.BUCKET("dev-documents").DELETE) && isEditing}
          <DeleteFileForm fileId={file.id} fileName={file.name} />
        {/if}
      </div>
    {/each}
  </div>
</section>
