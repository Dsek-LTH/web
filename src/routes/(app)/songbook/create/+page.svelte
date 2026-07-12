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
  import { Button } from "$lib/components/ui/button/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as m from "$paraglide/messages.js";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Plus from "@lucide/svelte/icons/plus";
  import { Spinner } from "$lib/components/ui/spinner";

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
        >{m.songbook_createNewSong()}</CardTitle
      >
      <CardDescription>{m.songbook_hereYoullFind()}</CardDescription>
    </CardHeader>
    <CardContent class="pt-6">
      <form
        method="POST"
        action="?/create"
        use:enhance
        class="flex flex-col gap-6"
      >
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
