# SvelteKit

SvelteKit is an application framework for Svelte that provides routing, server-side rendering, data fetching, and more.

::: tip Tutorial
Learn SvelteKit at [svelte.dev/tutorial/kit](https://svelte.dev/tutorial/kit).
:::

### SvelteKit example

::: code-group

```svelte [src/routes/+page.svelte]
<script lang="ts">
  export let data;
</script>

<p>{data.message}</p>
```

```ts [src/routes/+page.server.ts]
export const load = async () => {
  return { message: "Hello, world!" };
};
```

```html [src/app.html]
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

:::
