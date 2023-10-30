<script lang="ts">
  import type { FileData } from "$lib/files/fileHandler";
  import File from "./File.svelte";

  export let name: string;
  export let files: FileData[];
</script>

<section class="rounded-lg bg-base-200 p-4 pt-2 shadow">
  <h2 class="mb-2">{name}</h2>
  <div class="flex flex-wrap gap-2 [&>*]:max-w-[calc(50%-0.25rem)] [&>*]:flex-grow">
    {#each files as file (file.id)}
      <File {file} />
    {/each}
  </div>
</section>
