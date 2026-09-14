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
  import { Button } from "$lib/components/ui/button/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as m from "$paraglide/messages.js";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Plus from "@lucide/svelte/icons/plus";
  import { Spinner } from "$lib/components/ui/spinner";

  import SongSearch from "../SongSearch.svelte";

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance, delayed } = superForm(data.form, {
    delayMs: 300,
  });
</script>

<div class="mx-auto max-w-2xl px-4 py-8">
  <Button variant="ghost" href="/songbook" class="mb-6 flex items-center gap-2">
    <ArrowLeft class="h-4 w-4" />
    {m.back()}
  </Button>

  <Card class="border-border shadow-xl">
    <CardHeader class="bg-primary/5 border-border border-b-[1px] pb-6">
      <CardTitle class="text-3xl font-bold"
        >{m.songbook_addSongToSongbook()}</CardTitle
      >
      <CardDescription>{m.songbook_addSongToSongbookMoreInfo()}</CardDescription
      >
    </CardHeader>
    <CardContent class="pt-6">
      <form
        method="POST"
        action="?/create"
        use:enhance
        class="flex flex-col gap-6"
      >
        <div class="flex flex-col gap-2">
          <Label for="songId" class="text-base font-medium">
            {m.songbook_addSongToSongbookReferencedSong()}
          </Label>

          <input type="hidden" name="songId" bind:value={$form.songId} />

          <SongSearch bind:songId={$form.songId} />

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

        <div class="mt-4 flex items-center justify-end gap-4">
          <Button variant="outline" href="/songbook">
            {m.songbook_cancel()}
          </Button>
          <Button
            type="submit"
            disabled={$delayed}
            class="flex min-w-32 items-center gap-2"
          >
            {#if $delayed}
              <Spinner class="h-4 w-4" />
            {:else}
              <Plus class="h-4 w-4" />
              {m.songbook_create()}
            {/if}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</div>
