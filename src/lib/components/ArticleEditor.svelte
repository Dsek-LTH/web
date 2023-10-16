<script lang="ts">
  import { enhance } from "$app/forms";
  import type { Article as ArticleType, AuthorOption } from "$lib/articles.js";
  import Article from "$lib/components/Article.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import type { Tag } from "@prisma/client";

  export let authorOptions: AuthorOption[];
  export let allTags: Tag[];
  export let article: Omit<ArticleType, "likes"> = {
    id: "",
    slug: "",
    header: "",
    body: "",
    authorId: "",
    author: authorOptions[0],
    tags: [],
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    imageUrl: null,
  };
  let submitting: boolean = false;

  export let formData: Record<string, any> | undefined;
  // effect over default value above to work from for "edit article" as well
  $: (() => {
    if (!formData) return;
    if (formData.header) article.header = formData.header;
    if (formData.body) article.body = formData.body;
    if (formData.tags) {
      const oldTagIds = JSON.parse(formData.tags).map((tag: Tag) => tag.id);
      article.tags = allTags.filter((tag) => oldTagIds.includes(tag.id));
    }
    if (formData.author) {
      const oldAuthor = JSON.parse(formData.author);
      article.author =
        authorOptions.find((authorOption) => authorOption.id === oldAuthor.id) ?? article.author;
    }
    formData = undefined; // to stop formData from overriding what user changes
  })();
</script>

<main class="flex w-screen flex-col gap-8 px-4 pt-8 lg:flex-row lg:px-8 [&>*]:flex-1">
  <section>
    <form method="POST" class="form-control gap-4" use:enhance>
      <slot name="form-start" />
      <input
        name="header"
        class="input input-bordered"
        placeholder="Header"
        required
        bind:value={article.header}
      />
      <!-- <Tiptap /> -->
      <textarea
        id="editor"
        name="body"
        class="textarea textarea-bordered min-h-[10rem]"
        placeholder="Body"
        bind:value={article.body}
      />
      <select class="select select-bordered w-full max-w-xs" bind:value={article.author} required>
        {#each authorOptions as authorOption}
          <option value={authorOption}>
            {authorOption.member.firstName}
            {authorOption.member.lastName}{#if authorOption.mandate?.position.name},
              {authorOption.mandate?.position.name}
            {/if}
          </option>
        {/each}
      </select>
      <input type="hidden" name="author" value={JSON.stringify(article.author)} />
      <TagSelector {allTags} bind:selectedTags={article.tags} />
      <input type="hidden" name="tags" value={JSON.stringify(article.tags)} />
      <slot name="form-end" />
      <!-- <button type="submit" disabled style="display: none" aria-hidden="true" /> -->
      <button type="submit" disabled={submitting} class="btn btn-primary">
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </form>
    <slot name="error" />
  </section>
  <section>
    <span class="italic">Preview</span>
    {#if article != null}
      <Article article={{ ...article, likes: [] }} />
    {/if}
  </section>
</main>
