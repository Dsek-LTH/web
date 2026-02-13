<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as ButtonGroup from "$lib/components/ui/button-group";
  import * as Select from "$lib/components/ui/select";

  import FileUpload from "$lib/components/FileUpload.svelte";
  import Editor from "$lib/components/Editor.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";

  import * as m from "$paraglide/messages";

  import Pen from "@lucide/svelte/icons/pen";
  import User from "@lucide/svelte/icons/user";

  import { type SuperForm } from "sveltekit-superforms";

  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import type { ArticleSchema } from "$lib/news/schema";
  import type { AuthorOption } from "$lib/news/getArticles";
  import type { Snippet } from "svelte";
  import { Spinner } from "$lib/components/ui/spinner";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";

  let {
    allTags,
    superform,
    activeTab = $bindable(),
    authorOptions,
    formEnd,
  }: {
    allTags: Array<ExtendedPrismaModel<"Tag">>;
    activeTab: "sv" | "en";
    superform: SuperForm<ArticleSchema>;
    authorOptions: AuthorOption[];
    formEnd?: Snippet;
  } = $props();

  const { form, errors, enhance, delayed } = superform;

  const sameAuthorOption = (
    a: Pick<AuthorOption, "memberId" | "mandateId" | "customId" | "type">,
    b: Pick<AuthorOption, "memberId" | "mandateId" | "customId" | "type">,
  ) =>
    a.memberId === b.memberId &&
    a.mandateId === b.mandateId &&
    a.customId === b.customId &&
    a.type === b.type;

  let filelist: FileList | undefined = $state();

  $form.images.forEach((f) => {
    const dt = new DataTransfer();
    dt.items.add(f);
    filelist = dt.files;
  });
  function onFileUpload() {
    // @ts-expect-error -- expected
    $form.images = [...filelist];
  }
</script>

<form
  method="POST"
  class="form-control mb-8 flex w-full flex-col gap-4"
  enctype="multipart/form-data"
  use:enhance
>
  <div class="flex w-full flex-row">
    <div class="flex w-full flex-col gap-1.5">
      <Label for="header">{m.news_header()}</Label>
      <div class="flex flex-row gap-2">
        {#if activeTab == "sv"}<Input
            bind:value={$form.headerSv}
            type="text"
            id="headerSv"
            name="headerSv"
            aria-invalid={$errors.headerSv ? true : false}
            aria-errormessage={$errors.headerSv?.at(0)}
            placeholder={m.news_header()}><Pen /></Input
          >{:else}
          <Input
            bind:value={$form.headerEn}
            type="text"
            id="headerEn"
            name="headerEn"
            aria-invalid={$errors.headerEn ? true : false}
            aria-errormessage={$errors.headerEn?.at(0)}
            placeholder={m.news_header()}><Pen /></Input
          >
        {/if}
        <ButtonGroup.Root>
          <Button
            class={activeTab == "sv"
              ? "bg-neutral-100 dark:bg-neutral-900"
              : ""}
            onclick={() => (activeTab = "sv")}
            variant="outline">{m.language_swedish()}</Button
          >
          <Button
            class={activeTab == "en"
              ? "bg-neutral-100 dark:bg-neutral-900"
              : ""}
            onclick={() => (activeTab = "en")}
            variant="outline">{m.language_english()}</Button
          >
        </ButtonGroup.Root>
      </div>
    </div>
  </div>

  {#if activeTab == "sv"}
    <Editor
      aria-invalid={$errors.bodySv ? true : false}
      aria-errormessage={$errors.bodySv?.at(0)}
      name="bodySv"
      bind:value={$form.bodySv}
    />
  {:else}
    <Editor
      aria-invalid={$errors.bodyEn ? true : false}
      aria-errormessage={$errors.bodyEn?.at(0)}
      name="bodyEn"
      bind:value={$form.bodyEn as string | undefined}
    />
  {/if}

  <div class="flex w-full flex-col gap-1.5">
    <Label for="author">{m.news_author()}</Label>
    <Select.Root type="single" bind:value={$form.author as unknown as string}>
      <Select.Trigger class="w-full"
        ><User
        />{#if $form.author.type === "Custom" && $form.author.customAuthor != null}{$form
            .author.customAuthor.name}{:else}{$form.author.member.firstName}
          {$form.author.member
            .lastName}{#if $form.author.mandate?.position.name},
            {$form.author.mandate?.position.name}
          {/if}{/if}</Select.Trigger
      >
      <Select.Content>
        {#each authorOptions as authorOption (authorOption.id)}
          <Select.Item
            value={sameAuthorOption(authorOption, $form.author)
              ? ($form.author as unknown as string)
              : (authorOption as unknown as string)}
            >{#if authorOption.type === "Custom" && authorOption.customAuthor != null}
              {authorOption.customAuthor.name}
            {:else}
              {authorOption.member.firstName}
              {authorOption.member
                .lastName}{#if authorOption.mandate?.position.name},
                {authorOption.mandate?.position.name}
              {/if}
            {/if}</Select.Item
          >
        {/each}
      </Select.Content>
    </Select.Root>
  </div>

  <div class="flex w-full flex-col gap-1.5">
    <Label for="tags">{m.news_tags()}</Label>
    <TagSelector
      aria-invalid={$errors.tags ? true : false}
      aria-errormessage={$errors.tags?._errors?.at(0)}
      name="tags"
      bind:selectedTags={$form.tags}
      {allTags}
    />
  </div>

  <FileUpload
    multiple
    onchange={() => onFileUpload()}
    bind:files={() => filelist, (f) => (filelist = f)}
  />

  {@render formEnd?.()}

  <div class="flex w-full flex-col gap-1.5">
    <Label for="youtubeUrl">{m.news_youtube_url()}</Label><Input
      bind:value={$form.youtubeUrl}
      type="text"
      id="youtubeUrl"
      name="youtubeUrl"
      placeholder="https://youtube.com/v/..."><Pen /></Input
    >
  </div>
  <div class="flex w-full flex-row justify-between gap-1.5">
    <Button
      onclick={formEnd ? () => goto(resolve("/news")) : () => history.back()}
      variant="outline">{m.cancel()}</Button
    >
    <Button type="submit" class="block grow"
      >{formEnd ? m.news_publish() : m.save()}{#if $delayed}<Spinner
        />{/if}</Button
    >
  </div>
</form>
