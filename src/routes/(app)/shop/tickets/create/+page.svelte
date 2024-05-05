<script lang="ts">
  import TicketForm from "$lib/components/shop/TicketForm.svelte";
  export let data;
</script>

<svelte:head>
  <title>Skapa biljett | D-sektionen</title>
</svelte:head>

<TicketForm form={data.form} />
