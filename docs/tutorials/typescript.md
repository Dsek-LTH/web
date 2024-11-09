# TypeScript

TypeScript is a superset of JavaScript that adds static types to the language.

::: tip Tutorial
Learn TypeScript at [Codecademy](https://www.codecademy.com/learn/learn-typescript).
:::

### TypeScript example

```typescript
interface User {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
}

function updateUser(id: number, update: Partial<User>) {
  const user = getUser(id);
  const newUser = { ...user, ...update };
  saveUser(id, newUser);
}
```
