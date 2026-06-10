import type { ColumnDef } from "@tanstack/table-core";
import dayjs from "dayjs";
import Check from "@lucide/svelte/icons/check";
import Minus from "@lucide/svelte/icons/minus";
import X from "@lucide/svelte/icons/x";
import { renderComponent } from "$lib/components/ui/data-table";
import ExpenseLink from "./ExpenseLink.svelte";
import type { ExpandedExpense } from "./getExpenses";
import * as m from "$paraglide/messages";

export const columns: Array<ColumnDef<ExpandedExpense>> = [
  {
    accessorFn: (originalRow) => dayjs(originalRow.date).format("YYYY-MM-DD"),
    header: m.expense_date(),
  },
  {
    accessorFn: (originalRow) => {
      return [
        ...new Set(originalRow.items.map((item) => item.costCenter)),
      ].join(", ");
    },
    header: m.expense_type(),
  },
  {
    accessorKey: "description",
    header: m.expense_description(),
  },
  {
    accessorFn: (originalRow) => {
      // get unique signers based on signer.id
      const signerMap = originalRow.items.reduce((map, item) => {
        const member = item.signer;
        if (!map.has(member.id)) {
          map.set(member.id, member);
        }
        return map;
      }, new Map<string, ExpandedExpense["items"][number]["signer"]>());

      return Array.from(
        signerMap
          .values()
          .map((signer) => `${signer.firstName} ${signer.lastName}`),
      ).join(", ");
    },
    header: m.expense_responsible(),
  },
  {
    accessorFn: (originalRow) => {
      if (originalRow.items.every((item) => item.signedAt !== null)) {
        return "signed";
      } else if (originalRow.items.some((item) => item.signedAt !== null)) {
        return "partially signed";
      }
      return "unsigned";
    },
    header: m.expense_signed(),
    cell: (cell) => {
      const signedStatus = cell.getValue() as
        | "signed"
        | "partially signed"
        | "unsigned";

      if (signedStatus === "signed") {
        return renderComponent(Check, { class: "text-green-500" });
      }

      if (signedStatus === "partially signed") {
        return renderComponent(Minus, { class: "text-yellow-500" });
      }

      return renderComponent(X, { class: "text-red-500" });
    },
  },
  {
    accessorFn: (originalRow) => !originalRow.isGuildCard,
    header: m.expense_private(),
    cell: (cell) => {
      const isPrivate = cell.getValue() as boolean;

      if (isPrivate) {
        return renderComponent(Check, { class: "text-green-500" });
      }

      return renderComponent(X, { class: "text-red-500" });
    },
  },
  {
    accessorFn: (originalRow) =>
      `${originalRow.items
        .reduce((acc, item) => acc + item.amount / 100, 0)
        .toLocaleString()} kr`,
    header: m.expense_total(),
  },
  {
    header: "",
    cell: (cell) => {
      return renderComponent(ExpenseLink, { expense: cell.row.original });
    },
    id: "details",
  },
];
