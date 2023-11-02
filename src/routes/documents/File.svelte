<script lang="ts">
  import type { FileData } from "$lib/files/fileHandler";

  export let file: FileData;
  $: fileName = file.name.substring(0, file.name.lastIndexOf(".")).replace(/_+/g, " ");
</script>

<div class="tooltip" data-tip={fileName}>
  <a
    href={file.thumbnailUrl}
    class="btn btn-primary btn-sm block overflow-hidden text-ellipsis whitespace-nowrap py-2 text-left"
  >
    {fileName}
  </a>
</div>
