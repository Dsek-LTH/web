<script lang="ts">
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import YearSelector from "$lib/components/YearSelector.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import FileLink from "../FileLink.svelte";
  import DeleteFileForm from "../DeleteFileForm.svelte";
  import { PUBLIC_BUCKETS_DOCUMENTS } from "$env/static/public";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import * as m from "$paraglide/messages.js";

  let { data } = $props();

  let canDelete = $derived(
    isAuthorized(
      apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).DELETE,
      data.user,
    ),
  );
</script>

<SetPageTitle title={m.documents_requirementProfiles()} />

<div class="mx-auto w-full max-w-4xl px-4 py-8">
  <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold">{m.documents_requirementProfiles()}</h1>
      <p class="text-muted-foreground">
        {m.documents_requirementProfilesBlurb()}
      </p>
    </div>
    <YearSelector />
  </div>

  <div class="flex flex-col gap-6">
    {#each Object.entries(data.folders) as [folder, files] (folder)}
      <Card>
        <CardHeader>
          <CardTitle>{folder}</CardTitle>
        </CardHeader>
        <CardContent
          class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3"
        >
          {#each files as file (file.id)}
            <div class="flex items-center gap-1">
              {#if file.thumbnailUrl}
                <FileLink name={file.name} url={file.thumbnailUrl} full />
              {/if}
              {#if canDelete}
                <DeleteFileForm
                  fileId={file.id}
                  fileName={file.name}
                  data={data.deleteForm}
                />
              {/if}
            </div>
          {/each}
        </CardContent>
      </Card>
    {/each}
  </div>
</div>
