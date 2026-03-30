<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import FileText from "@lucide/svelte/icons/file-text";
  import { page } from "$app/state";
  import { PUBLIC_BUCKETS_DOCUMENTS } from "$env/static/public";
  import type { FileData } from "$lib/files/fileHandler";
  import apiNames from "$lib/utils/apiNames";
  import DeleteFileForm from "./DeleteFileForm.svelte";
  import FileLink from "./FileLink.svelte";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { DeleteSchema } from "./+page.server";
  import { isAuthorized } from "$lib/utils/authorization";
  import * as m from "$paraglide/messages";

  let {
    deleteForm,
    name,
    files,
    isEditing,
  }: {
    deleteForm: SuperValidated<DeleteSchema>;
    name: string;
    files: FileData[];
    isEditing: boolean;
  } = $props();

  const findFile = (names: string[]) =>
    files
      .filter((f) =>
        names.some((s) => f.name.toLowerCase().includes(s.toLowerCase())),
      )
      .sort(
        (f1, f2) => (f1.modDate?.getTime() ?? 0) - (f2.modDate?.getTime() ?? 0),
      )
      .pop();

  let notice = findFile(["Kallelse", "Notice"]);
  let agenda = findFile(["Föredragningslista", "Foredragningslista", "Agenda"]);
  let minutes = findFile(["Protokoll", "Minutes, Minute"]);

  let filteredFiles = $derived(
    files.filter((f) => {
      if (notice && f.id == notice.id) return false;
      if (agenda && f.id == agenda.id) return false;
      if (minutes && f.id == minutes.id) return false;
      return true;
    }),
  );
</script>

<div>
  <h4 class="ml-2 pb-1">{name}</h4>
  <section class="flex flex-col rounded-md">
    <div
      class="bg-background flex flex-row gap-2 rounded-t-md border-[1px] p-2"
    >
      <a href={notice && notice.thumbnailUrl!}
        ><Button
          disabled={!notice}
          variant="outline"
          class="cursor-pointer rounded-sm"
          ><FileText /> {m.documents_notice()}</Button
        ></a
      >
      <a href={agenda && agenda.thumbnailUrl!}
        ><Button
          variant="outline"
          disabled={!agenda}
          class="cursor-pointer rounded-sm"
          ><FileText /> {m.documents_agenda()}</Button
        ></a
      >
      <a href={minutes && minutes.thumbnailUrl!}
        ><Button
          variant="outline"
          disabled={!minutes}
          class="cursor-pointer rounded-sm"
          ><FileText /> {m.documents_minutes()}</Button
        ></a
      >
    </div>
    <div
      class="bg-muted-background mb-2 grid grid-flow-row grid-cols-1 gap-2 rounded-b-md border-[1px] border-t-0 px-2 pt-1 pb-2 sm:grid-cols-2 md:grid-cols-3"
    >
      {#each filteredFiles as file (file.id)}
        <div class="flex items-center gap-0">
          {#if file.thumbnailUrl}
            <FileLink
              class={isEditing
                ? "rounded-full! rounded-r-none! border-[1px] border-r-0"
                : ""}
              name={file.name}
              url={file.thumbnailUrl}
              full
            />
          {/if}
          {#if isAuthorized(apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).DELETE, page.data.user) && isEditing}
            <DeleteFileForm
              class={isEditing
                ? "rounded-r-full! border-[1px] py-5! pr-0.5!"
                : ""}
              fileId={file.id}
              fileName={file.name}
              data={deleteForm}
            />
          {/if}
        </div>
      {/each}
    </div>
  </section>
</div>
