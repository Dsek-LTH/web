# ZenStack

ZenStack is a toolkit built on top of Prisma that adds an access control layer, an auto-generated API, and more.

::: tip Tutorial
Learn ZenStack at [ZenStack](https://zenstack.dev/docs/the-complete-guide/).
:::

### ZenStack example

```prisma
// schema.zmodel
model User {
  id    Int     @id @default(autoincrement())
  name  String
  email String  @unique

  // everybody can signup
  @@allow("create,read", true)

  // full access by self
  @@allow("all", auth() == this)

  // deny delete for all
  @@deny("delete", true)
}
```

```typescript
export const prismaClient = new PrismaClient();
const prisma = enhance(prismaClient, user);
await prisma.user.create({
  data: {
    name: "Alice",
    email: "alice@example.com",
  },
});

// throws error: ACCESS_POLICY_VIOLATION
await prisma.user.delete({
  where: { name: "Alice" },
});
```
