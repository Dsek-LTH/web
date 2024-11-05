---
outline: deep
---

# About our tech stack

### Why Svelte?

Svelte is incredibly easy to learn and stays true to standard Web API:s. It has a simple syntax, great documentation and first-party learning material while at the same time being one of the more performant web frameworks. It's not as broadly used as React (yet), but it's still highly admired among developers ([source](https://2022.stateofjs.com/en-US/libraries/)). [This article](https://joshcollinsworth.com/blog/antiquated-react) does a good job of breaking down why React might no longer be the best option.

### Why SvelteKit?

SvelteKit is a natural choice to go along with Svelte. It provides the features we need, including client-side routing, server-side rendering, static-site generation. It has a simple approach to data fetching that make it easy to understand what happens on the server and what happens on the client. This is by far the most important feature for us, considering the complexity we faced with our previous Next.js application and its GraphQL API.

There are not many other options compatible with Svelte, but Astro is also a strong contender. While Astro looks amazing, it’s still at heart a MPA framework designed for static content sites. Our page might require too much dynamic content for Astro to be the best option. Astro supports that of course through its island architecture but SvelteKit simply seems more appropriate. Furthermore, the View Transitions API is not yet supported by browsers thus mostly requiring a JS runtime for smooth client-side navigation. It's possible that Astro will become a better choice at some point, especially if View Transitions become broadly supported ([it looks amazing](https://astro.build/blog/astro-3/)).

### Why not use a UI component library?

There is a lot of competition in this category. Here's a brief rundown of some of the choices considered roughly ranked by category and preference.

1. [daisyUI](https://daisyui.com/) = Simple CSS-only components that serve as a good starting ground. Customizable, and can be used as a headless component library if you wish.
2. [Tailwind CSS](https://tailwindcss.com/) = Tailwind CSS encourages good design through it’s constraint-based design system. While its syntax may be hard to swallow at first, it shifts our way of styling applications by discouraging poor abstractions and preferring repetition.
3. [Pink Design](https://pink.appwrite.io/) = Like daisyUI, but without building on Tailwind CSS.
4. [Open Props](https://open-props.style/) = Open Props is what we’d opt for if using only CSS. Like Svelte, it stays true to CSS through its use of CSS variables. However, a bit sparse for a fully-fledged app.
5. [SCSS](https://sass-lang.com/) = Adds some convenience to CSS.
6. [Skeleton](https://www.skeleton.dev/) = A fully fledged component library for Svelte. Highly customizable and built on Tailwind.
7. [shadcn-svelte](https://www.shadcn-svelte.com/) = Doesn't seem to be quite as good as its React counter-part.
8. [Ionic Components](https://ionicframework.com/docs/components) = Since we've chosen not to use Capacitor this options is no longer really a contender.
9. [Flowbite](https://flowbite-svelte.com/) = Like Skeleton, but less popular.
10. [Carbon Components](https://carbon-components-svelte.onrender.com/) = Frankly I don't think it looks very good.
11. [SMUI](https://sveltematerialui.com/) = Like MUI, but for Svelte. Doesn't seem to be as good as its React counter-part.

Ultimately, we decided to go with daisyUI and Tailwind CSS for now, but we might switch to a more fully-fledged component library in the future.

### Why use Prisma?

Prisma is hugely popular and the de-facto standard for TypeScript ORMs. It's easy to use and abstracts away some of the complexity of dealing with databases. New options like Drizzle look appealing, but we voted to stick with Prisma for now. The performance of Prisma has been criticised, but that has mostly been in the context of serverless deployments.

### Why use React Native?

This is perphaps the most questionable part of our tech stack. Broadly speaking, Expo and React Native are probably considered a safe choice for building cross-platform mobile apps, but for our purposes other alternatives may be more appropriate:

1. React Native WebView = Expo with React Native WebView still provides one of the easiest solutions to building an app with push notification support. Through their Expo Application Services we can easily build and deploy for both Android and iOS through the cloud.
2. Progressive Web App = PWA seems like the future. They’re getting more and more support on iOS and solve the performance problems we've seen in our React Native WebView app through caching and offline modes.
3. Ionic/Capacitor = Ionic and Capacitor look awesome, but they have some trade-offs that make them hard to adopt. The markup syntax is unwieldly and regressing to having to build iOS apps on a Mac OS machine seems terrible. Furthermore, we might not be able to use SvelteKit's routing if we used Capacitor. If we truly embraced mobile first these trade-offs might be worth it to get a more native mobile experience. As for now, responsive mobile-first design will have to do.
4. Framework7 = Framework7 makes much of the same promises as Ionic. Just like Ionic it ships with its own client-side router making both it pretty much a no-go.

### Why still use node and pnpm?

With all the hype around new runtimes such as deno and bun it may seem odd to stick to node. Unfortunately, at the time of writing both of these new have tradeoffs that make node the better choice. First and foremost node is the default which makes it easier for beginners. It also ships with both yarn and pnpm through corepack allowing easy use of these faster package managers. As for the promised runtime performance benefits of bun these are still mostly unproven and some benchmarks show bun performing worse that node. There are also issues surrounding package compatibility for both deno and bun. However, this can change in the future and we should be open to revisiting this decision.
