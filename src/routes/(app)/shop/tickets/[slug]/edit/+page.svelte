<script lang="ts">
  import TicketForm from "$lib/components/shop/TicketForm.svelte";
  export let data;
</script>

<svelte:head>
  <title>Uppdatera biljett | D-sektionen</title>
</svelte:head>

<TicketForm form={data.form} event={data.event} type="edit" />
