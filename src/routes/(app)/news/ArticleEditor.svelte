<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import MarkdownEditor from "$lib/components/MarkdownEditor.svelte";
  import AuthorSignature from "$lib/components/socials/AuthorSignature.svelte";
  import TagChip from "$lib/components/TagChip.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import * as m from "$paraglide/messages";
  import type { Tag } from "@prisma/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";
  import Article from "./Article.svelte";
  import type { AuthorOption } from "./articles.js";
  import type { ArticleSchema } from "./schema";

  export let data: SuperValidated<ArticleSchema>;
  export let authorOptions: AuthorOption[];
  export let allTags: Tag[];
  let publishing = false;
  const { form, errors, constraints, enhance } = superForm(data, {
    dataType: "json",
  });

  const sameAuthorOption = (
    a: Pick<AuthorOption, "memberId" | "mandateId" | "customId" | "type">,
    b: Pick<AuthorOption, "memberId" | "mandateId" | "customId" | "type">,
  ) =>
    a.memberId === b.memberId &&
    a.mandateId === b.mandateId &&
    a.customId === b.customId &&
    a.type === b.type;
</script>

<main
  class="container mx-auto flex flex-col gap-8 px-4 pt-8 lg:flex-row [&>*]:flex-1"
>
  <section>
    <form method="POST" class="form-control gap-2" use:enhance>
      <slot name="form-start" />
      <Input
        name="header"
        label={m.news_header()}
        bind:value={$form.header}
        {...$constraints.header}
        error={$errors.header}
      />
      <Labeled label={m.news_description()} error={$errors.body}>
        <MarkdownEditor bind:value={$form.body} {...$constraints.body} />
      </Labeled>
      <Labeled
        label={m.news_author()}
        error={$errors.author !== undefined ? m.news_invalidAuthor() : ""}
      >
        <select
          id="author"
          class="select select-bordered w-full max-w-xs"
          bind:value={$form.author}
          required
        >
          {#each authorOptions as authorOption}
            <option
              value={sameAuthorOption(authorOption, $form.author)
                ? $form.author
                : authorOption}
            >
              {#if authorOption.type === "Custom" && authorOption.customAuthor != null}
                {authorOption.customAuthor.name}
              {:else}
                {authorOption.member.firstName}
                {authorOption.member
                  .lastName}{#if authorOption.mandate?.position.name},
                  {authorOption.mandate?.position.name}
                {/if}
              {/if}
            </option>
          {/each}
        </select>
      </Labeled>
      <Labeled
        label={m.news_tags()}
        error={$errors.tags !== undefined ? m.news_invalidTags() : ""}
      >
        <TagSelector {allTags} bind:selectedTags={$form.tags} />
      </Labeled>
      <slot name="form-end" />
      <!-- <button type="submit" disabled style="display: none" aria-hidden="true" /> -->
      <button type="submit" disabled={publishing} class="btn btn-primary mt-4">
        {publishing ? m.news_publishing() : m.news_publish()}
      </button>
    </form>
    <slot name="error" />
  </section>
  <section>
    <span class="italic">{m.news_preview()}</span>
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
        customAuthor={$form.author.customAuthor}
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
