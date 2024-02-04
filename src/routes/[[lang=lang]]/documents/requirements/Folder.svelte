<script lang="ts">
  import File from "../File.svelte";
  import type { FileData } from "$lib/files/fileHandler";
  import { displayPdf } from "$lib/utils/servePdf";

  type Folder = {
    name: string;
    isFolder: boolean;
    url: string;
    files: Folder[];
  };
  export let expanded = true;
  export let name: string;
  export let folders: Folder[];

  console.log("SENASTE========");
  console.log(folders);
  console.log(folders[0]);
  console.log(folders[0]?.files);
  console.log(folders[0]?.name);
  console.log(folders[0]?.url);
  function toggle() {
    expanded = !expanded;
  }
</script>

<div class="flex" class:w-full={true} class:expanded data-tip={name}>
  <button on:click={toggle}
    ><span class="i-mdi-folder-outline align-text-top text-xl text-primary"
    ></span>
    {name}
  </button>
</div>

<div class="m-2 border-l border-white pl-5">
  {#if expanded}
    <ul>
      {#each folders as folder}
        <li>
          {#if folder.isFolder}
            <svelte:self
              name={folder.name}
              folders={folder.files}
              expanded={false}
            />
          {:else}
            <File name={folder.name} url={folder.url} />
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>
