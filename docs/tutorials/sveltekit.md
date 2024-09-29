# SvelteKit

SvelteKit helps you build web apps while following modern best practices and providing solutions to common development challenges. It offers everything from basic functionalities — like a router that updates your UI when a link is clicked — to more advanced capabilities. Learn SvelteKit at [learn.svelte.dev](https://learn.svelte.dev/tutorial/introducing-sveltekit).

### SvelteKit example

::: code-group

```svelte [src/routes/+page.svelte]
<script lang="ts">
  export let data;
</script>

<p>{data}</p>
```

```ts [src/routes/+page.server.ts]
export const load = async () => {
  return { data: "Hello, world!" };
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
