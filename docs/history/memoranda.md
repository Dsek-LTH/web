# Memoranda

## 2024

![Website landing page 2024](../assets/dsek-2024.png)

[@danieladugyan](https://github.com/danieladugyan)

TO-DO

## 2023

![Website landing page 2023](../assets/dsek-2023.png)

[@danieladugyan](https://github.com/danieladugyan)

In early 2023, we finally released our long awaited rewrite of the web page :tada:. After many years of failed efforts, we finally managed to replace our aging PHP website. Unlike the old website, the new one is based on modern tools and frameworks like React, Next.js, GraphQL, Docker, etc. It also features a brand new design.

However, as I gradually settled into my new role, I realised that all was not golden. It took me months before I felt confident making changes. Even still, the technical complexity of our new codebase made development very difficult. The code was tightly coupled together and the layers upon layers of abstractions made it cumbersome to make changes.

Before summer, we had a meeting where we looked back on the first 6 months together. We enjoyed our technical discussions and felt like we had learned a lot together, but there was still lots to improve upon. Prompting the team for feedback, I learned that code reviews were very slow, the development environment was too difficult to set up and the backend was hard to understand.

This feedback was hardly surprising. I had already encountered lots of issues when trying to help people set up our development environment consisting of 8 Docker containers(!). The lack of type-safety from a very lax tsconfig made errors hard to spot during reviews. The backend seemed to originally be designed around the idea of micro-services, and even though only one core service was left it was still split up into:

- _datasources_, which fetched information from tables in the database using a query builder,
- _resolvers_, which defined our GraphQL resolvers, and
- _schemas_, which defined our GraphQL API surface.

And that was just for the backend! On the frontend we had create:

- corresponding GraphQL _queries_, and
- then generate _hooks_ for actually fetching the data.

All in all this made any seemingly small change require lots of changes in multiple different places.

In hindsight it's worth acknowledging though that this is inevitable for a project of this scope, especially with the unique circumstance that the team gets replaced every year. At the time we had around 60 000 LOC, little to no documentation and only one member in the team who had worked on the project previously.

Anyways, while developing the nollning pages during the summer two issues really started to become major annoyances. Firstly, it had begun impossible to update our dependencies. We relied on an old file-browser library that in turn relied on an outdated version of Material UI. This meant that we were stuck on an old version of one of our most major dependencies. Secondly, and perhaps more importantly, Next.js 13 was released and brought with it React Server Components. React Server Components were really a major change in how web applications were meant to be created. It marked a shift away from the primarily client-rendered SPA architectures that React had made so popular, and instead moved us back to the previous era of rendering content on the server. I saw it as an opportunity to unify frontend and backend development into one cohesive full-stack application.

However, updating to Next.js 13 was no small task. It would have been a massive effort to rewrite all of our components to use the new data fetching logic and furthermore it's a transition that's quite disruptive to the React ecosystem as a whole. Most libraries need to be updated to support the new paradigm. In addition to that, at the time of deciding on our path forward, the transition was not done yet - server actions were still experimental and I personally found the `"use client"` directive a bit lacking.

So as many have surely done before me, I began drafting a document titled "New tech stack". The outlook of refactoring all of our code pushed me to consider other options than React/Next - [this article](https://www.mux.com/blog/what-are-react-server-components) brings up a lot of great points about the challenges of RSC and [this one](https://joshcollinsworth.com/blog/antiquated-react) reminds us that there are options other than React. The details of our new tech stack is better left to the documentation, but it's fair to say there's little reason to go with React today other than its ecosystem and popularity. After careful consideration we settled on Svelte for it's ease of use and SvelteKit for it's simple data fetching logic. We choose to use an ORM for our database logic to further simplify the backend parts of our application. We abandoned Material UI and went for a more lightweight design library that allows us to implement more custom designs.

Thus, with [commit 1b503aa](https://github.com/Dsek-LTH/web/commit/1b503aa2a04a0c1251308a5e9be9e6604565bdf1) another rewrite begins. We gathered the team during GeekenD and managed to make good progress. Originally, the goal was to be able release a beta version shortly thereafter, but as always things take more time than expected. During development of the new page, development of the old page is all but completely suspended. This is never great since it creates a period of gradual decline while bugs are left unattended to.

In conclusion, I think rewrites are inevitable. Working on old code that you don't fully understand is just not fun. Under normal circumstances it can be hard to get acquainted with a new codebase, but we have the additional disadvantages of being relatively inexperienced and almost our entire team gets replaced every year. No wonder so many people have given up before. I think it's essential to limit the duration of rewrites to a single elective period. Only if many team members continue over to the next year can we ever hope to have any sort of continuity in our development. Thankfully that's the case this time.
