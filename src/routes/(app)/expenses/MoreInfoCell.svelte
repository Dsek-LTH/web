<script lang="ts">
  import ScanEye from "@lucide/svelte/icons/scan-eye";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import type { ExpandedExpense } from "./getExpenses";
  import ExpenseDialog from "./ExpenseDialog.svelte";

  const { expense }: { expense: ExpandedExpense } = $props();
</script>

<Dialog.Root>
  <Dialog.Trigger class={buttonVariants({ variant: "outline" })}
    ><ScanEye /></Dialog.Trigger
  >
  <ExpenseDialog {expense} />
</Dialog.Root>
