<script lang="ts">
  import type { FileData } from "$lib/files/fileHandler";
  export let files: { next: FileData[]; last: FileData[] };
</script>

<div class="flex flex-col gap-2 rounded-2xl bg-base-300 p-4">
  <h2 class="text-xl font-bold">Nästa möte</h2>
  <ul class="menu p-0">
    {#each files.next as file}
      <li>
        <a href={file.thumbnailUrl}>
          <span class="i-mdi-document size-6" />
          {file.name}
        </a>
      </li>
    {/each}
  </ul>
  <h2 class="text-xl font-bold">Senaste mötet</h2>
  <ul class="menu p-0">
    {#each files.last as file}
      <li>
        <a href={file.thumbnailUrl}>
          <span class="i-mdi-document size-6" />
          {file.name}
        </a>
      </li>
    {/each}
  </ul>
</div>
