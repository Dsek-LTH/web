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
  import { Textarea } from "$lib/components/ui/textarea/index.js";
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

  let { data } = $props();
  let song = $derived(data.song);

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance, delayed } = superForm(data.updateForm, {
    delayMs: 300,
  });

  const canDelete = $derived(
    data.user?.policies?.includes(apiNames.SONG.DELETE),
  );
</script>

<div class="mx-auto max-w-2xl px-4 py-8">
  <Button
    variant="ghost"
    href="/songbook/{song.slug}"
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
        {#if song.deletedAt}
          <span
            class="bg-destructive/10 text-destructive rounded-full px-3 py-1 text-sm font-semibold"
          >
            {m.songbook_deleted()}
          </span>
        {/if}
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
        <input type="hidden" name="id" value={$form.id} />

        <div class="flex flex-col gap-2">
          <Label for="title" class="text-base font-medium"
            >{m.songbook_title()}</Label
          >
          <Input
            id="title"
            name="title"
            bind:value={$form.title}
            placeholder={m.songbook_title()}
            required
            class={$errors.title
              ? "border-destructive focus-visible:ring-destructive"
              : ""}
          />
          {#if $errors.title}
            <p class="text-destructive text-sm font-medium">{$errors.title}</p>
          {/if}
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="flex flex-col gap-2">
            <Label for="category" class="text-base font-medium"
              >{m.songbook_category()}</Label
            >
            <Input
              id="category"
              name="category"
              list="category-options"
              bind:value={$form.category}
              placeholder={m.songbook_categoryExplanation()}
              class={$errors.category
                ? "border-destructive focus-visible:ring-destructive"
                : ""}
            />
            <datalist id="category-options">
              {#each data.existingCategories as category (category)}
                <option value={category}></option>
              {/each}
            </datalist>
            {#if $errors.category}
              <p class="text-destructive text-sm font-medium">
                {$errors.category}
              </p>
            {/if}
          </div>

          <div class="flex flex-col gap-2">
            <Label for="melody" class="text-base font-medium"
              >{m.songbook_melody()}</Label
            >
            <Input
              id="melody"
              name="melody"
              list="melody-options"
              bind:value={$form.melody}
              placeholder={m.songbook_melodyExplanation()}
              class={$errors.melody
                ? "border-destructive focus-visible:ring-destructive"
                : ""}
            />
            <datalist id="melody-options">
              {#each data.existingMelodies as melody (melody)}
                <option value={melody}></option>
              {/each}
            </datalist>
            {#if $errors.melody}
              <p class="text-destructive text-sm font-medium">
                {$errors.melody}
              </p>
            {/if}
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <Label for="video" class="text-base font-medium"
            >Video URL (YouTube/Direct Link)</Label
          >
          <Input
            id="video"
            name="video"
            type="url"
            bind:value={$form.video}
            placeholder="e.g. https://www.youtube.com/watch?v=..."
            class={$errors.video
              ? "border-destructive focus-visible:ring-destructive"
              : ""}
          />
          {#if $errors.video}
            <p class="text-destructive text-sm font-medium">{$errors.video}</p>
          {/if}
        </div>

        <div class="flex flex-col gap-2">
          <Label for="lyrics" class="text-base font-medium"
            >{m.songbook_lyrics()}</Label
          >
          <Textarea
            id="lyrics"
            name="lyrics"
            rows={12}
            bind:value={$form.lyrics}
            placeholder={m.songbook_lyrics()}
            required
            class="font-serif text-base leading-relaxed {$errors.lyrics
              ? 'border-destructive focus-visible:ring-destructive'
              : ''}"
          />
          {#if $errors.lyrics}
            <p class="text-destructive text-sm font-medium">{$errors.lyrics}</p>
          {/if}
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
            disabled={$delayed}
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
