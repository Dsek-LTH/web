<script lang="ts">
  import type { PageData } from "./$types";
  import Folder from "./Folder.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  import { PUBLIC_BUCKETS_DOCUMENTS } from "$env/static/public";
  import type { FolderType } from "./+page.server";

  export let data: PageData;

  let isEditing = false;

  const currentYear = new Date().getFullYear();
  const folders: FolderType[] = [];

  $: {
    folders.length = 0; // make folders empty
    Object.keys(data["folders"]).forEach((folder) => {
      processFolder(folder, "", folders);
    });
  }

  /*
      The purpose of this function is to take the input from data.folders and make it into a recursive folder structure that works
      well with the Folder component, which is also recursive. 
      For each of the items in data.folders, which is a path to a file. It recursively goes down the path, adding it to pathSoFar,
      pathSoFar is used because multiple files can share parts of their path.
  */
  function processFolder(
    folder: string,
    pathSoFar: string,
    array: FolderType[],
  ) {
    if (pathSoFar.startsWith("/")) pathSoFar = pathSoFar.substring(1);
    const name = folder.split("/")[0];
    //If reached the end of the folder path, add all files with pathSoFar to array
    if (folder) {
      const exists = array?.find((f) => f.name === name);
      let newArray: FolderType[];
      //If path already exists use that, otherwise add to the array
      if (exists) {
        newArray = exists.files;
      } else {
        array.push({
          id: "",
          url: "",
          name: name ? name : "undefined",
          isFolder: true,
          files: [],
        });
        newArray = array[array?.length - 1]!.files;
      }
      processFolder(
        folder.split("/").slice(1).join("/"),
        pathSoFar + "/" + name,
        newArray,
      );
    } else {
      data.folders[pathSoFar]?.forEach((file) => {
        array.push({
          id: file.id,
          name: file.name,
          isFolder: false,
          url: file.thumbnailUrl ? file.thumbnailUrl : "",
          files: [],
        });
      });
    }
  }
</script>

<svelte:head>
  <title>Kravprofiler | D-sektionen</title>
</svelte:head>

<div class="mb-4 flex w-full flex-col items-start gap-2">
  <span class="text-lg">Filtrera efter år</span>
  <Pagination
    class="max-w-prose"
    count={currentYear - 1981}
    getPageName={(pageNumber) => (currentYear - pageNumber).toString()}
    getPageNumber={(pageName) => currentYear - +pageName}
    fieldName="year"
  />

  <div class="flex flex-col gap-1">
    {#if isAuthorized(apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).CREATE, data.user)}
      <a
        class="btn btn-primary btn-sm"
        href="/documents/upload?type=requirement">Ladda upp fil</a
      >
    {/if}
    {#if isAuthorized(apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).DELETE, data.user)}
      <button
        class="btn btn-secondary btn-sm"
        on:click={() => {
          isEditing = !isEditing;
        }}
      >
        {isEditing ? "Sluta redigera" : "Redigera"}
      </button>
    {/if}
  </div>
</div>

<div class="flex flex-col rounded-lg bg-base-200 p-5">
  <Folder name="" {folders} deleteForm={data.deleteForm} {isEditing} />
</div>
