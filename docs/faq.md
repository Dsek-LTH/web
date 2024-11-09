---
outline: deep
---

# Frequently asked questions

### Why is there an `(app)` folder?

In SvelteKit, a folder with a name wrapped in parentheses is a group. It is used to group different routes to have different layouts. In our case it's used to remove the navbar and footer on the onboarding page (found in `(app)/onboarding`). You can read more about it in the [SvelteKit docs](<https://svelte.dev/docs/kit/advanced-routing#Advanced-layouts-(group)>).

### Why does my Markdown content shift around when the page loads?

If you wrap Markdown content with a link (an anchor tag), there's a good chance that this behaviour will occur. This is because nested `<a>` tags are [prohibited in HTML](https://stackoverflow.com/questions/13052598/creating-anchor-tag-inside-anchor-tag). You can solve the issue by wrapping your Markdown content with a button that programmatically navigates instead.
