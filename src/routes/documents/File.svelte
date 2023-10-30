<script lang="ts">
  import type { FileData } from "$lib/files/fileHandler";

  export let file: FileData;
  $: fileName = file.name.substring(0, file.name.lastIndexOf(".")).replace(/_+/g, " ");
</script>

<div class="tooltip rounded-md bg-primary p-2 px-4" data-tip={fileName}>
  <a
    href={file.thumbnailUrl}
    class="block overflow-hidden text-ellipsis whitespace-nowrap text-center font-semibold"
  >
    {fileName}
  </a>
</div>
