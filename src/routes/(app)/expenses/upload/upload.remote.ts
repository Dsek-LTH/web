import { form } from "$app/server";
import { expenseSchema } from "../types";

export const createExpense = form(expenseSchema, (data, issue) => {
  console.log(issue);
  console.log(data);
});
