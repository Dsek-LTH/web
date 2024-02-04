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

  let isEditing: boolean = false;

  const currentYear = new Date().getFullYear();
  let test: Folder[] = [];

  Object.keys(data.folders).forEach((folder) => {
    processFolder(folder, "", test);
  });
  console.log("Object keys:");
  console.log(Object.keys(data.folders));
  console.log("============================");

  function f(): Folder[] {
    Object.keys(data.folders).forEach((folder) => {
      processFolder(folder, "", test);
    });
    return test;
  }
  function processFolder(folder: string, pathSoFar: string, array: Folder[]) {
    if (pathSoFar.startsWith("/")) pathSoFar = pathSoFar.substring(1);
    const name = folder.split("/")[0];
    if (folder) {
      const exists = array.find((f) => f.name === name);
      if (exists) {
        processFolder(
          folder.split("/").slice(1).join("/"),
          pathSoFar + "/" + name,
          exists.files,
        );
      } else {
        array.push({
          url: "",
          name: name ? name : "undefined",
          isFolder: true,
          files: [],
        });
        processFolder(
          folder.split("/").slice(1).join("/"),
          pathSoFar + "/" + name,
          array[array?.length - 1]!.files,
        );
      }
    } else {
      console.log("path: " + pathSoFar);
      data.folders[pathSoFar]?.forEach((file) => {
        array.push({
          name: file.name,
          isFolder: false,
          url: file.thumbnailUrl,
          files: [],
        });
      });
    }
  }

  console.log("efter process");
  console.log(test);
  console.log(test.find((f) => f.name === "Test")!.files);

  $: folders = f;
  console.log("HÄÄÄÄÄÄÄÄÄÄÄÄR");
  console.log(folders);
</script>

<svelte:head>
  <title>Kravprofiler | D-sektionen</title>
</svelte:head>

yo yo yo

<div class="flex flex-col gap-4">
  <Folder name={currentYear.toString()} folders={test} />
</div>
