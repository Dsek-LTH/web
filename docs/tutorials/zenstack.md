# ZenStack

ZenStack is an open-source toolkit built on top of Prisma that among other things adds an access control layer and an auto-generated API. Learn ZenStack at [ZenStack](https://zenstack.dev/docs/the-complete-guide/).

### ZenStack example

To use ZenStack in your application, you need to define your data model in a `schema.zmodel` file.

```prisma
model User {
  id    Int     @id @default(autoincrement())
  name  String
  email String  @unique
  posts Post[]

  // everybody can signup
  @@allow("create,read", true)

  // full access by self
  @@allow("all", auth() == this)
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  content   String?
  published Boolean @default(false)

  // allow read for all signin users
  @@allow("read", auth() != null && published)

  // full access by author
  @@allow("all", author == auth())
}
```

Enhancing the Prisma client with ZenStack is as simple as calling the `enhance` function. This will enforce the access control rules defined in the `schema.zmodel` file. You can then query your database as normal using ZenStack Client.

```typescript
import { PrismaClient } from "@prisma/client";
import { enhance } from "@zenstackhq/runtime";
export const prismaClient = new PrismaClient();
const prisma = enhance(prismaClient);
```
