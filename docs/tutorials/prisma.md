# Prisma

Prisma is a modern database toolkit that makes it easy to work with databases in your application. It replaces traditional ORMs and simplifies database workflows. Learn Prisma at [Prisma](https://www.prisma.io/docs/getting-started/quickstart).

### Prisma example

To use Prisma in your application, you need to define your data model in a `schema.prisma` file.

```prisma
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

You can the query your database using Prisma Client. Here's an example of how you can create a new user with a post.

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice@example.com",
      posts: {
        create: { title: "Hello, World!" },
      },
    },
  });
  console.log(user);
}
```
