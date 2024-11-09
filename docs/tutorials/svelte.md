# Svelte

Svelte is a component framework used to build more advanced web applications.

::: tip Tutorial
Learn Svelte at [svelte.dev/tutorial](https://svelte.dev/tutorial).
:::

### Svelte example

```svelte
<script lang="ts">
  const name = "world";
  let count = $state(0);

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
