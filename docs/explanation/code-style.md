# About our code style

For starters, we use [Prettier](https://prettier.io/) which is an opinionated code formatter. As such, it enforces consistent formatting throughout the codebase. Using consistent formatting makes the code easier to read for all contributors and will therefore be enforced by our continuous integration pipeline checks.

Going beyond formatting, we should:

- Prefer **simple code** over performant code, unless absolutely necessary ([read more](https://wiki.c2.com/?PrematureOptimization)).
- Write **self-documenting code** ([read more](https://en.wikipedia.org/wiki/Self-documenting_code)).
- **Avoid abbreviations** and technical nomenclature, within reason.
- **Follow conventions** and keep new code in-line with existing code.
- **Co-locate code** that is related ([read more](https://kentcdodds.com/blog/colocation)).
- **Avoid premature abstrations** ([read more](https://overreacted.io/goodbye-clean-code/))

The most important point of all is the last one. It's often tempting to introduce an abstraction when we notice duplicated code. Sometimes that's appropriate, but often it is not. Before abstracting away duplicated code ask yourself:

- Are these pieces of code guaranteed to stay the same in perpetuity?
- Are these pieces of code located close to each other or are they parts of completely different code? Co-located abstractions will be easier to change later down the road, while a change to a separate file like `utils/usefulFunction.ts` could cause unforseen changes throughout the application.
- Will this need to be parametrized in the future by adding props and conditional logic? A good example could be how we previously added an `isNolla` prop throughout our application to many different components so that they could then be used on our dsek.se/nolla pages too. A better solution would be too simply copy the code since these components are obviously not the same. If they truly were, we wouldn't have to add a prop simply to cater to their new use case.
