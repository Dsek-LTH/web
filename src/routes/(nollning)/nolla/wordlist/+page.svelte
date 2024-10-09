<script lang="ts">
  // As to avoid cluttering up the translation file, all words in the word list are part of a single translation value
  // The format is like this: Definition - description\nDefinition - description
  import * as m from "$paraglide/messages";
  const words = m.nolla_wordlist();
  const wordList = words.split("\n").map((word) => {
    const [definition, description] = word.split(" - ");

    return {
      definition,
      description: description?.replace(
        /([sS]e) ([a-zA-ZÅÄÖåäö]+)/,
        (_, before, word) =>
          `${before} <a class="link" href="#${word.toLowerCase()}">${word}</a>`,
      ),
    };
  });
</script>

<header>
  <h1 class="nolla-page-title">
    {m.nolla_wordlist_header()}
  </h1>
</header>
<article>
  <ul>
    {#each wordList as word}
      <li
        id={word.definition?.toLowerCase()}
        class="rounded-xl p-2 transition-all target:bg-primary"
      >
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <b>{word.definition}</b> - {@html word.description}
      </li>
    {/each}
  </ul>
</article>
