# CSS

CSS is a way to change the look of HTML web pages.

::: tip Tutorial
Learn CSS at [Codecademy](https://www.codecademy.com/learn/learn-css).
:::

### CSS example

```css
body {
  background-color: lightblue;
}

h1 {
  color: white;
  text-align: center;
}

p {
  font-family: verdana;
  font-size: 20px;
}
```

## Tailwind CSS

Tailwind CSS is a CSS framework that provides utility classes that are used to apply styles rapidly. We do not provide any tutorial, but there are helpful [cheatsheets](https://nerdcave.com/tailwind-cheat-sheet) available that lists all the utility classes available in Tailwind.

### Tailwind example

::: code-group

```html [HTML]
<button
  class="flex items-center bg-blue-500 px-4 py-3 text-white hover:bg-blue-400"
/>
  Click me!
</button>
```

```css [CSS]
/* Automatically generated from the Tailwind classes used in the HTML */
.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.bg-blue-500 {
  --tw-bg-opacity: 1;
  background-color: rgb(59 130 246 / var(--tw-bg-opacity));
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.py-3 {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

.text-white {
  --tw-text-opacity: 1;
  color: rgb(255 255 255 / var(--tw-text-opacity));
}

.hover\:bg-blue-400:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(96 165 250 / var(--tw-bg-opacity));
}
```

:::
