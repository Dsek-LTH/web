# Prisma

Prisma is a database ORM that makes it easy to work with databases in a type-safe manner.

::: tip Tutorial
Learn Prisma at [Prisma](https://www.prisma.io/docs/getting-started/quickstart).
:::

### Prisma example

```prisma
// schema.prisma
model User {
  id    Int     @id @default(autoincrement())
  name  String
  email String  @unique
  posts Post[]
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  content   String?
}
```

```typescript
const prisma = new PrismaClient();
await prisma.user.create({
  data: {
    name: "Alice",
    email: "alice@example.com",
    posts: {
      create: { title: "Hello, World!" },
    },
  },
});
```
