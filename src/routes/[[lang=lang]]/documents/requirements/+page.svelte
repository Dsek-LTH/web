<script lang="ts">
  import type { PageData } from "./$types";
  import Folder from "./Folder.svelte";

  export let data: PageData;

  type Folder = {
    name: string;
    isFolder: boolean;
    url: string;
    files: Folder[];
  };

  //let isEditing: boolean = false;

  const currentYear = new Date().getFullYear();
  let folders: Folder[] = [];

  Object.keys(data["folders"]).forEach((folder) => {
    processFolder(folder, "", folders);
  });

  function processFolder(folder: string, pathSoFar: string, array: Folder[]) {
    if (pathSoFar.startsWith("/")) pathSoFar = pathSoFar.substring(1);
    const name = folder.split("/")[0];
    if (folder) {
      const exists = array.find((f) => f.name === name);
      let newArray: Folder[];
      if (exists) {
        newArray = exists.files;
      } else {
        newArray = [
          {
            url: "",
            name: name ? name : "undefined",
            isFolder: true,
            files: [],
          },
        ];
        array.push(...newArray);
      }
      processFolder(
        folder.split("/").slice(1).join("/"),
        pathSoFar + "/" + name,
        newArray,
      );
    } else {
      console.log("path: " + pathSoFar);
      data.folders[pathSoFar]?.forEach((file) => {
        array.push({
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

<div class="flex flex-col gap-4">
  <Folder name={currentYear.toString()} {folders} />
</div>
