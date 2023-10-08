<script lang="ts">
  import Article from "$lib/components/Article.svelte";
  import type { AuthorOption } from "./+page.server.js";
  import type { Tag } from "@prisma/client";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import { enhance } from "$app/forms";

  // import Tiptap from "$lib/TipTap.svelte";
  export let data;
  export let form;
  let header: string;
  let body: string;
  let author: AuthorOption;
  let tags: Tag[] = [];
  let submitting: boolean = false;
  // $: authorOptions = data.authorOptions;
  $: article = ((): import("$lib/articles.js").Article | null => {
    const value: import("$lib/articles.js").Article = {
      id: "",
      slug: "",
      header: header ?? "",
      body: body ?? "",
      authorId: "",
      author: {
        id: "",
        ...(author ?? data.authorOptions[0]),
      },
      tags,
      likes: [],
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrl: null,
    };
    return value;
  })();
</script>

<main class="flex w-screen flex-col gap-8 px-4 pt-8 lg:flex-row lg:px-8 [&>*]:flex-1">
  <section>
    <form
      method="POST"
      class="form-control gap-4"
      use:enhance={(e) => {
        if (!confirm("Vill du publicera nyheten?")) {
          console.log("cancelled");
          e.cancel();
          return;
        }
        submitting = true;

        return async ({ update }) => {
          submitting = false;
          await update();
        };
      }}
    >
      <input
        name="header"
        class="input input-bordered"
        placeholder="Header"
        required
        bind:value={header}
      />
      <!-- <Tiptap /> -->
      <textarea
        id="editor"
        name="body"
        class="textarea textarea-bordered min-h-[10rem]"
        placeholder="Body"
        bind:value={body}
      />
      <select class="select select-bordered w-full max-w-xs" bind:value={author} required>
        {#each data.authorOptions as authorOption}
          <option value={authorOption}>
            {authorOption.member.firstName}
            {authorOption.member.lastName}
            {#if authorOption.mandate?.position.name}
              {authorOption.mandate?.position.name}
            {/if}
          </option>
        {/each}
      </select>
      <input type="hidden" name="author" value={JSON.stringify(author)} />
      <TagSelector allTags={data.allTags} bind:selectedTags={tags} />
      <input type="hidden" name="tags" value={JSON.stringify(tags)} />
      <!-- <button type="submit" disabled style="display: none" aria-hidden="true" /> -->
      <button type="submit" disabled={submitting} class="btn btn-primary">
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </form>
    {#if form?.error}
      <p class="text-error">
        {form.error}
      </p>
    {/if}
  </section>
  <section>
    <span class="italic">Preview</span>
    {#if article != null}
      <Article {article} />
    {/if}
  </section>
</main>
