<script lang="ts">
  import Folder from "./Folder.svelte";
  import { run } from "svelte/legacy";

  import type { SuperValidated } from "sveltekit-superforms";
  import DeleteFileForm from "../DeleteFileForm.svelte";
  import FileLink from "../FileLink.svelte";
  import type { DeleteSchema } from "./+page.server";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  import { PUBLIC_BUCKETS_DOCUMENTS } from "$env/static/public";
  import { page } from "$app/stores";
  import type { FolderType } from "./+page.server";

  interface Props {
    expanded?: boolean;
    name: string;
    folders: FolderType[];
    isEditing?: boolean;
    deleteForm: SuperValidated<DeleteSchema>;
  }

  let {
    expanded = $bindable(true),
    name,
    folders,
    isEditing = false,
    deleteForm,
  }: Props = $props();

  function foldersFirstAlphabetically(a: FolderType, b: FolderType) {
    if (a.isFolder && !b.isFolder) {
      return -1;
    }
    if (b.isFolder && !a.isFolder) {
      return 1;
    }
    return a.name.localeCompare(b.name, "sv");
  }
  run(() => {
    folders.sort(foldersFirstAlphabetically);
  });

  let foldericon = $derived(
    expanded ? "i-mdi-folder-open-outline" : "i-mdi-folder-outline",
  );
  function toggle() {
    expanded = !expanded;
  }
</script>

<div class="flex" data-tip={name}>
  <button onclick={toggle}
    ><span class={foldericon + " align-text-top text-xl text-primary"}></span>
    {name}
  </button>
</div>

<div class="m-2 border-l border-gray-400 pl-5">
  {#if expanded}
    {#each folders as folder}
      {#if folder.isFolder}
        <Folder
          name={folder.name}
          folders={folder.files}
          expanded={false}
          {isEditing}
          {deleteForm}
        />
      {:else}
        <div class="flex flex-row gap-1">
          <FileLink name={folder.name} url={folder.url} />
          {#if isAuthorized(apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).DELETE, $page.data.user) && isEditing}
            <DeleteFileForm
              fileId={folder.id}
              fileName={folder.name}
              data={deleteForm}
            />
          {/if}
        </div>
      {/if}
    {/each}
  {/if}
</div>
