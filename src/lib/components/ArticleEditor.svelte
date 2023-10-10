<script lang="ts">
  import { enhance } from "$app/forms";
  import Article from "$lib/components/Article.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import type { Tag as TagType } from "@prisma/client";
  import type { AuthorOption } from "../../routes/news/create/+page.server";

  export let authorOptions: AuthorOption[];
  $: authorOptionsWithId = authorOptions.map((authorOption) => ({
    ...authorOption,
    id: "",
  }));
  export let allTags: TagType[];
  export let article: Omit<import("$lib/articles.js").Article, "likes"> = {
    id: "",
    slug: "",
    header: "",
    body: "",
    authorId: "",
    author: {
      id: "",
      ...authorOptions[0],
    },
    tags: [],
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    imageUrl: null,
  };
  let submitting: boolean = false;
  // $: authorOptions = data.authorOptions;
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
        {#each authorOptionsWithId as authorOption}
          <option
            value={{
              id: "",
            }}
          >
            {authorOption.member.firstName}
            {authorOption.member.lastName}
            {#if authorOption.mandate?.position.name}
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
