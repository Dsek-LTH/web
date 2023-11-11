<script lang="ts">
  import { enhance } from "$app/forms";
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import type { Article as ArticleType, Tag } from "@prisma/client";
  import Article from "./Article.svelte";
  import AuthorSignature from "./AuthorSignature.svelte";
  import type { AuthorOption } from "./articles.js";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import TagChip from "$lib/components/TagChip.svelte";
  import MarkdownEditor from "$lib/components/MarkdownEditor.svelte";

  export let authorOptions: AuthorOption[];
  export let selectedAuthorOption: AuthorOption = authorOptions[0]!;
  export let allTags: Tag[];
  export let selectedTags: Tag[] = [];
  export let article: ArticleType = {
    id: "",
    slug: "",
    header: "",
    headerEn: "",
    body: "",
    bodyEn: "",
    authorId: "",
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    removedAt: null,
    status: "draft",
    imageUrl: null,
  };
  let submitting: boolean = false;

  export let formData: Record<string, unknown> | undefined;
  // effect over default value above to work from for "edit article" as well
  $: (() => {
    if (!formData) return;
    if (formData.header) article.header = formData.header as string;
    if (formData.body) article.body = formData.body as string;
    if (formData.tags) {
      const oldTagIds = JSON.parse(formData.tags as string).map((tag: Tag) => tag.id);
      selectedTags = allTags.filter((tag) => oldTagIds.includes(tag.id));
    }
    if (formData.author) {
      const oldAuthor = JSON.parse(formData.author as string);
      selectedAuthorOption =
        authorOptions.find((authorOption) => authorOption.id === oldAuthor.id) ??
        selectedAuthorOption;
    }
    formData = undefined; // to stop formData from overriding what user changes
  })();
</script>

<main class="flex w-screen flex-col gap-8 px-4 pt-8 lg:flex-row lg:px-8 [&>*]:flex-1">
  <section>
    <form method="POST" class="form-control gap-2" use:enhance>
      <slot name="form-start" />
      <Input name="header" label="Header" required bind:value={article.header} />
      <Labeled label="Description" id="body">
        <MarkdownEditor bind:value={article.body} />
        <input type="hidden" name="body" value={article.body} />
      </Labeled>
      <Labeled label="Author" id="author">
        <select
          id="author"
          class="select select-bordered w-full max-w-xs"
          bind:value={selectedAuthorOption}
          required
        >
          {#each authorOptions as authorOption}
            <option value={authorOption}>
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
      <input type="hidden" name="author" value={JSON.stringify(selectedAuthorOption)} />
      <Labeled label="Taggar" id="autocomplete">
        <TagSelector {allTags} bind:selectedTags />
      </Labeled>
      <input type="hidden" name="tags" value={JSON.stringify(selectedTags)} />
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
    {#if article != null}
      <Article {article}>
        <AuthorSignature
          slot="author"
          member={selectedAuthorOption.member}
          position={selectedAuthorOption.mandate?.position}
          customAuthor={selectedAuthorOption.customAuthor ?? undefined}
          type={selectedAuthorOption.type}
        />

        <div slot="tags" class="flex flex-row flex-wrap gap-2">
          {#each selectedTags as tag}
            <TagChip {tag} />
          {/each}
        </div>
      </Article>
    {/if}
  </section>
</main>
