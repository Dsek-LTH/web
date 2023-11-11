<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import MarkdownEditor from "$lib/components/MarkdownEditor.svelte";
  import TagChip from "$lib/components/TagChip.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import type { Tag } from "@prisma/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";
  import Article from "./Article.svelte";
  import AuthorSignature from "./AuthorSignature.svelte";
  import type { AuthorOption } from "./articles.js";
  import { goto } from "$app/navigation";
  import type { ArticleSchema } from "./schema";

  export let data: SuperValidated<ArticleSchema>;
  export let authorOptions: AuthorOption[];
  export let allTags: Tag[];
  export let redirectUrl: string = "/news";
  let submitting: boolean = false;
  const { form, errors, constraints, enhance } = superForm(data, {
    dataType: "json",
    onResult: async (event) => {
      if (event.result.type === "success") {
        await goto(redirectUrl);
      }
    },
  });

  const sameAuthorOption = (
    a: Pick<AuthorOption, "memberId" | "mandateId" | "customId" | "type">,
    b: Pick<AuthorOption, "memberId" | "mandateId" | "customId" | "type">
  ) =>
    a.memberId === b.memberId &&
    a.mandateId === b.mandateId &&
    a.customId === b.customId &&
    a.type === b.type;
</script>

<main class="flex w-screen flex-col gap-8 px-4 pt-8 lg:flex-row lg:px-8 [&>*]:flex-1">
  <section>
    <form method="POST" class="form-control gap-2" use:enhance>
      <slot name="form-start" />
      <Input name="header" label="Header" bind:value={$form.header} {...$constraints.header} />
      {#if $errors.header}<p class="text-error">{$errors.header}</p>{/if}
      <Labeled label="Description" id="body">
        <MarkdownEditor bind:value={$form.body} {...$constraints.body} />
      </Labeled>
      {#if $errors.body}<p class="text-error">{$errors.body}</p>{/if}
      <Labeled label="Author" id="author">
        <select
          id="author"
          class="select select-bordered w-full max-w-xs"
          bind:value={$form.author}
          required
        >
          {#each authorOptions as authorOption}
            <option
              value={sameAuthorOption(authorOption, $form.author) ? $form.author : authorOption}
            >
              {#if authorOption.type === "Custom" && authorOption.customAuthor != null}
                {authorOption.customAuthor.name}
              {:else}
                {authorOption.member.firstName}
                {authorOption.member.lastName}{#if authorOption.mandate?.position.name},
                  {authorOption.mandate?.position.name}
                {/if}
              {/if}
            </option>
          {/each}
        </select>
      </Labeled>
      {#if $errors.author}<p class="text-error">{$errors.author}</p>{/if}
      <Labeled label="Taggar" id="autocomplete">
        <TagSelector {allTags} bind:selectedTags={$form.tags} />
      </Labeled>
      {#if $errors.tags}<p class="text-error">{$errors.tags}</p>{/if}
      <slot name="form-end" />
      <!-- <button type="submit" disabled style="display: none" aria-hidden="true" /> -->
      <button type="submit" disabled={submitting} class="btn btn-primary mt-4">
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </form>
    <slot name="error" />
  </section>
  <section>
    <span class="italic">Preview</span>
    <Article
      article={{
        id: "",
        slug: "",
        header: $form.header,
        headerEn: "",
        body: $form.body,
        bodyEn: "",
        authorId: $form.author.id,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        removedAt: null,
        status: "draft",
        imageUrl: null,
      }}
    >
      <AuthorSignature
        links={false}
        slot="author"
        member={$form.author.member}
        position={$form.author.mandate?.position}
        customAuthor={$form.author.customAuthor ?? undefined}
        type={$form.author.type}
      />

      <div slot="tags" class="flex flex-row flex-wrap gap-2">
        {#each $form.tags as tag}
          <TagChip {tag} />
        {/each}
      </div>
    </Article>
  </section>
</main>
