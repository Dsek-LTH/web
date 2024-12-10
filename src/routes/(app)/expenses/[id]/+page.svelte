<script lang="ts">
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  import ExpenseDetailView from "../ExpenseDetailView.svelte";

  export let data;
  $: expense = data.expense;
  const superform = superForm(data.updateForm, {
    dataType: "json",
  });
</script>

<PageHeader title="Utlägg #{expense.id}" />

<ExpenseDetailView {expense} {superform} />
