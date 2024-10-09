# Tailwind

Tailwind is a low-level framework that provides you with all the building blocks you need to create a design system. It is not opinionated and does not come with pre-designed components. Instead, it provides you with a set of utility classes that you can use to build your own components. If you already know CSS, you can start using Tailwind right away.

The documentation for Tailwind is available at [tailwindcss.com](https://tailwindcss.com/). There are also helpful [cheatsheets](https://nerdcave.com/tailwind-cheat-sheet) available that lists all the utility classes available in Tailwind.

### Tailwind example

By applying utility classes to an HTML element, you can style it without writing any CSS.

```html
<button
  class="flex items-center bg-blue-500 px-4 py-3 text-white hover:bg-blue-400"
/>
  Click me!
</button>
```

Tailwind classes are compiled into CSS when you build your project.

```css
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
