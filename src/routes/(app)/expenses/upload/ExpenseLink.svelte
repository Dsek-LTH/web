<script lang="ts">
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import type { ExpandedExpense } from "../getExpenses";
  import Button from "$lib/components/ui/button/button.svelte";

  let { expense }: { expense: ExpandedExpense } = $props();
</script>

<Button
  size="icon-sm"
  variant="ghost"
  href="/expenses/{expense.id}"
  target="_blank"
>
  <ExternalLink />
</Button>
