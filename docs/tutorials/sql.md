# SQL

SQL is a language used to interact with databases. It is used to create, read, update, and delete data in databases. SQL is a standard language for relational databases, but many databases use SQL with their own extensions. Learn SQL at [Codecademy](https://www.codecademy.com/learn/learn-sql).

## SQL example

```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255)
);

INSERT INTO users (id, name, email)
  VALUES (1, 'Alice', 'alice@example.com')
  (2, 'Bob', 'bob@example.com')
  (3, 'Charlie', 'charlie@example.com');

SELECT * FROM users;
```

The result of the `SELECT` statement above would be:

| id  | name    | email               |
| --- | ------- | ------------------- |
| 1   | Alice   | alice@example.com   |
| 2   | Bob     | bob@example.com     |
| 3   | Charlie | charlie@example.com |
