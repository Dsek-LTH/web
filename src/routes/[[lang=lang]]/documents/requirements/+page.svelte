<script lang="ts">
  import type { PageData } from "./$types";
  import Folder from "./Folder.svelte";
  import Pagination from "$lib/components/Pagination.svelte";

  export let data: PageData;

  type Folder = {
    name: string;
    isFolder: boolean;
    url: string;
    files: Folder[];
  };

  let isEditing: boolean = false;

  const currentYear = new Date().getFullYear();
  let folders: Folder[] = [];

  $: {
    folders = [];
    Object.keys(data["folders"]).forEach((folder) => {
      processFolder(folder, "", folders);
    });
  }

  function processFolder(folder: string, pathSoFar: string, array: Folder[]) {
    if (pathSoFar.startsWith("/")) pathSoFar = pathSoFar.substring(1);
    const name = folder.split("/")[0];
    if (folder) {
      const exists = array?.find((f) => f.name === name);
      let newArray: Folder[];
      if (exists) {
        newArray = exists.files;
      } else {
        array.push({
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
        console.log(file);
        array.push({
          name: file.name,
          isFolder: false,
          url: file.thumbnailUrl ? file.thumbnailUrl : "",
          files: [],
        });
      });
    }
  }
  console.log(folders);
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
</div>

<div class="flex flex-col rounded-lg bg-base-200 p-5">
  <Folder name={""} {folders} />
</div>
