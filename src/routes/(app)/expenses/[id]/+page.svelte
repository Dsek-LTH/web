<script lang="ts">
  import * as m from "$paraglide/messages";
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  import ExpenseDetailView from "../ExpenseDetailView.svelte";

  export let data;
  $: expense = data.expense;
  const superform = superForm(data.updateForm);
</script>

<PageHeader title="{m.expense()} #{expense.id}" />

<ExpenseDetailView {expense} {superform} itemForm={data.updateItemForm} />
