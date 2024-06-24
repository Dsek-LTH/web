<script lang="ts">
  import ConsumablesTable from "./ConsumablesTable.svelte";

  export let data;
  $: ticket = data.ticket;
  /* Don't know how to show these yet or if we even want that
  $: inCart = data.inCart;
  $: reservations = data.reservations;
  */
</script>

<svelte:head>
  <title>{ticket.title} | D-sektionen</title>
</svelte:head>

<div class="flex justify-between">
  <h1 class="text-2xl">{ticket.title}</h1>

  <a href="edit" class="btn btn-secondary">Redigera biljett</a>
</div>
{#if ticket.description}
  <p class="text-lg">{ticket.description}</p>
{/if}

<p>
  {data.purchasedConsumables.length} köpta <br />
  {#if data.consumablesInCart.length > 0}
    {#if data.consumablesInCart.length > 1}
      {data.consumablesInCart.length} i kundvagner<br />
    {:else}
      1 i kundvagn<br />
    {/if}
  {/if}
  {#if data.reservations.length > 0}
    {#if data.reservations.length > 1}
      {data.reservations.length} reservationer<br />
    {:else}
      1 reservation<br />
    {/if}
  {/if}
</p>
<a href="manage/download-csv" class="btn btn-primary btn-sm mt-2"
  ><span class="i-mdi-download" /> Ladda ner CSV</a
>

<ConsumablesTable
  consumables={data.purchasedConsumables}
  title="Köpta biljetter"
/>

{#if data.consumablesInCart.length > 0}
  <ConsumablesTable consumables={data.consumablesInCart} title="I kundvagn" />
{/if}

{#if data.reservations.length > 0}
  <ConsumablesTable consumables={data.reservations} title="Reservationer" />
{/if}
