<script lang="ts">
  import ConsumableRow from "./ConsumableRow.svelte";

  export let data;
  $: ticket = data.ticket;
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

<div class="overflow-x-auto">
  <table class="table">
    <!-- head -->
    <thead>
      <tr>
        <th>Person</th>
        <th>Köptes</th>
        <th>Konsumerades</th>
        <th>Stripeköp ID</th>
        <th>Konsumera</th>
        <th>Återbetala</th>
      </tr>
    </thead>
    <tbody>
      {#each data.consumables as consumable (consumable.id)}
        <ConsumableRow
          {consumable}
          stripeIntentBaseUrl={data.stripeIntentBaseUrl}
        />
      {/each}
    </tbody>
  </table>
</div>
