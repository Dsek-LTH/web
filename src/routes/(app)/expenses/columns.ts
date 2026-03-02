import type { ColumnDef } from "@tanstack/table-core";
import type { ExpandedExpense } from "./+page.server";
import dayjs from "dayjs";
import Check from "@lucide/svelte/icons/check";
import Minus from "@lucide/svelte/icons/minus";
import X from "@lucide/svelte/icons/x";
import { renderComponent } from "$lib/components/ui/data-table";
import MoreInfoCell from "./MoreInfoCell.svelte";

export const columns: Array<ColumnDef<ExpandedExpense>> = [
  {
    header: "",
    cell: (cell) => {
      return renderComponent(MoreInfoCell, { expense: cell.row.original });
    },
    id: "details",
  },
  {
    accessorFn: (originalRow) => dayjs(originalRow.date).format("DD/MM/YYYY"),
    header: "Date",
  },
  {
    accessorFn: (originalRow) => {
      return [...new Set(originalRow.items.map((item) => item.costCenter))];
    },
    header: "Kostnadsställe(n)",
  },
  {
    accessorKey: "description",
    header: "Description",
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
      );
    },
    header: "Assigned to",
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
    header: "Signed",
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
    header: "Private",
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
    header: "Totalbelopp",
  },
];
