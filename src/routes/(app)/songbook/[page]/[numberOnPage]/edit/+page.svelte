<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
  } from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as m from "$paraglide/messages.js";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Save from "@lucide/svelte/icons/save";
  import Trash from "@lucide/svelte/icons/trash";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import { Spinner } from "$lib/components/ui/spinner";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import apiNames from "$lib/utils/apiNames";
  import SongSearch from "../../../SongSearch.svelte";

  let { data } = $props();
  let song = $derived(data.song);

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance, delayed, tainted } = superForm(
    data.updateForm,
    {
      delayMs: 300,
    },
  );

  const canDelete = $derived(
    data.user?.policies?.includes(apiNames.SONG.DELETE),
  );
</script>

<div class="mx-auto max-w-2xl px-4 py-8">
  <Button
    variant="ghost"
    href="/songbook/{data.songBookEntry.page}/{data.songBookEntry.numberOnPage}"
    class="mb-6 flex items-center gap-2"
  >
    <ArrowLeft class="h-4 w-4" />
    {m.back()}
  </Button>

  <Card class="border-border shadow-xl">
    <CardHeader class="bg-primary/5 border-border border-b-[1px] pb-6">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="text-3xl font-bold">{m.songbook_edit()}</CardTitle>
          <CardDescription>"{song.title}"</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent class="pt-6">
      <form
        id="update-form"
        method="POST"
        action="?/update"
        use:enhance
        class="flex flex-col gap-6"
      >
        <div class="flex flex-col gap-2">
          <Label for="songId" class="text-base font-medium">
            {m.songbook_addSongToSongbookReferencedSong()}
          </Label>

          <input type="hidden" name="songId" bind:value={$form.songId} />

          <SongSearch bind:songId={$form.songId} title={song.title} />

          {#if $errors.songId}
            <p class="text-destructive text-sm font-medium">
              {$errors.songId}
            </p>
          {/if}
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="flex flex-col gap-2">
            <Label for="page" class="text-base font-medium"
              >{m.songbook_page()}</Label
            >
            <Input
              id="page"
              name="page"
              bind:value={$form.page}
              placeholder={m.songbook_page_placeholder()}
              class={{
                "border-destructive focus-visible:ring-destructive":
                  $errors.page,
              }}
            />
            {#if $errors.page}
              <p class="text-destructive text-sm font-medium">
                {$errors.page}
              </p>
            {/if}
          </div>

          <div class="flex flex-col gap-2">
            <Label for="numberOnPage" class="text-base font-medium"
              >{m.songbook_numberOnPage()}</Label
            >
            <Input
              id="numberOnPage"
              name="numberOnPage"
              bind:value={$form.numberOnPage}
              placeholder={m.songbook_numberOnPagePlaceholder()}
              class={{
                "border-destructive focus-visible:ring-destructive":
                  $errors.numberOnPage,
              }}
            />
            {#if $errors.numberOnPage}
              <p class="text-destructive text-sm font-medium">
                {$errors.numberOnPage}
              </p>
            {/if}
          </div>
        </div>
      </form>

      <div
        class="border-border mt-8 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          {#if canDelete}
            {#if song.deletedAt}
              <form method="POST" action="?/restore" class="inline-block">
                <input type="hidden" name="id" value={song.id} />
                <Button
                  type="submit"
                  variant="outline"
                  class="flex items-center gap-2"
                >
                  <RotateCcw class="h-4 w-4" />
                  {m.songbook_restoreFromGarbageCan()}
                </Button>
              </form>
            {:else}
              <AlertDialog.Root>
                <AlertDialog.Trigger
                  class={buttonVariants({ variant: "destructive" })}
                >
                  <Trash class="h-4 w-4" />
                  {m.songbook_removeSong()}
                </AlertDialog.Trigger>
                <AlertDialog.Content>
                  <AlertDialog.Header>
                    <AlertDialog.Title
                      >{m.songbook_removeSong()}</AlertDialog.Title
                    >
                    <AlertDialog.Description>
                      {m.songbook_areYouSure()} "{song.title}"?
                    </AlertDialog.Description>
                  </AlertDialog.Header>
                  <AlertDialog.Footer>
                    <AlertDialog.Cancel
                      >{m.songbook_cancel()}</AlertDialog.Cancel
                    >
                    <form action="?/delete" method="POST">
                      <input type="hidden" name="id" value={song.id} />
                      <AlertDialog.Action
                        type="submit"
                        class={buttonVariants({ variant: "destructive" })}
                      >
                        {m.songbook_removeSong()}
                      </AlertDialog.Action>
                    </form>
                  </AlertDialog.Footer>
                </AlertDialog.Content>
              </AlertDialog.Root>
            {/if}
          {/if}
        </div>

        <div class="flex items-center justify-end gap-4">
          <Button variant="outline" href="/songbook/{song.slug}">
            {m.songbook_cancel()}
          </Button>
          <Button
            type="submit"
            form="update-form"
            disabled={$delayed || !$tainted}
            class="flex min-w-32 items-center gap-2"
          >
            {#if $delayed}
              <Spinner class="h-4 w-4" />
            {:else}
              <Save class="h-4 w-4" />
              {m.save()}
            {/if}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
