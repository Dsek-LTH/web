<script lang="ts">
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import YearSelector from "$lib/components/YearSelector.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import FileLink from "$lib/components/files/FileLink.svelte";
  import { PUBLIC_BUCKETS_FILES } from "$env/static/public";
  import apiNames from "$lib/utils/apiNames";
  import * as m from "$paraglide/messages.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { buttonVariants } from "$lib/components/ui/button";
  import Trash from "@lucide/svelte/icons/trash";
  import { api } from "$lib/api/client";
  import { invalidateAll } from "$app/navigation";
  import { toast } from "$lib/stores/toast";

  let { data } = $props();

  // Only decides whether to show the button - Go enforces the delete
  // policy itself. Requirement profiles live in the files bucket.
  let canDelete = $derived(
    !!data.user?.policies?.includes(
      apiNames.FILES.BUCKET(PUBLIC_BUCKETS_FILES).DELETE,
    ),
  );

  // Pure-proxy mutation straight to Go (DESIGN.md's Principle #5), like
  // Meeting.svelte's file delete.
  async function removeFile(id: string) {
    const res = await api.DELETE("/requirement-profiles", {
      params: { query: { key: id } },
    });
    if (res.error) {
      toast(res.error.detail ?? m.documents_fileDeleted(), "error");
      return;
    }
    toast(m.documents_fileDeleted(), "success");
    await invalidateAll();
  }
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
    {#each data.folders as { name: folder, files } (folder)}
      <Card>
        <CardHeader>
          <CardTitle>{folder}</CardTitle>
        </CardHeader>
        <CardContent
          class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3"
        >
          {#each files ?? [] as file (file.id)}
            <div class="flex items-center gap-1">
              <FileLink name={file.name} url={file.url} full />
              {#if canDelete}
                {@render deleteButton(file)}
              {/if}
            </div>
          {/each}
        </CardContent>
      </Card>
    {/each}
  </div>
</div>

{#snippet deleteButton(file: { id: string; name: string })}
  <AlertDialog.Root>
    <AlertDialog.Trigger
      class={buttonVariants({ size: "icon", variant: "outline" })}
    >
      <Trash />
    </AlertDialog.Trigger>
    <AlertDialog.Content>
      <AlertDialog.Header>
        <AlertDialog.Title
          ><!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html m.documents_deleteAreYouSure({
            fileName: file.name,
          })}</AlertDialog.Title
        >
        <AlertDialog.Description>
          {m.documents_modal_subtitle()}
        </AlertDialog.Description>
      </AlertDialog.Header>
      <AlertDialog.Footer>
        <AlertDialog.Cancel type="button">{m.cancel()}</AlertDialog.Cancel>
        <AlertDialog.Action onclick={() => removeFile(file.id)}
          >{m.delete_delete()}</AlertDialog.Action
        >
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Root>
{/snippet}
