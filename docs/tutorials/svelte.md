# Svelte

Svelte is a tool used to build more advanced web applications. You can learn Svelte at [learn.svelte.dev](https://learn.svelte.dev/).

### Svelte example

```svelte
<script lang="ts">
  const name = "world";
  let count = 0;

  function handleClick() {
    count += 1;
  }
</script>

<h1>Hello {name}!</h1>

<button on:click={handleClick}>
  Clicked {count}
  {#if count === 1}
    time
  {:else}
    times
  {/if}
</button>
```
