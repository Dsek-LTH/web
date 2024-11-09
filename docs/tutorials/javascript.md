# JavaScript

JavaScript is a programming language that is used to make web pages interactive.

::: tip Tutorial
Learn JavaScript at [Codecademy](https://www.codecademy.com/learn/introduction-to-javascript).
:::

### JavaScript example

```javascript
const inputElement = document.querySelector("input");
const buttonElement = document.querySelector("button");
const listElement = document.querySelector("ul");

buttonElement.addEventListener("click", () => {
  const text = inputElement.value;
  const listItemElement = document.createElement("li");
  listItemElement.textContent = text;
  listElement.appendChild(listItemElement);
  inputElement.value = "";
});
```
