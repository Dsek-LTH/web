<script lang="ts">
  import CreateTicketForm from "./CreateTicketForm.svelte";
  // Assuming you have a schema definition based on zod

  export let data;
</script>

<svelte:head>
  <title>Skapa biljett | D-sektionen</title>
</svelte:head>

<CreateTicketForm form={data.form} />
