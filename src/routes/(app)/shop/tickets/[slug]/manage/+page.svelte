<script lang="ts">
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import dayjs from "dayjs";

  export let data;
  $: ticket = data.ticket;
</script>

<svelte:head>
  <title>{ticket.title} | D-sektionen</title>
</svelte:head>

<div class="flex justify-between">
  <h1 class="text-2xl">{ticket.title}</h1>

  <a href="edit" class="btn btn-secondary">Redigera</a>
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
        <th>Återbetala</th>
      </tr>
    </thead>
    <tbody>
      {#each data.consumables as consumable (consumable.id)}
        {@const member = consumable.member}
        <!-- row 1 -->
        <tr>
          <td>
            <div class="flex items-center gap-3">
              <MemberAvatar
                class="h-8 w-8"
                {member}
                identficationHash={consumable.externalCustomerCode}
              />
              <div>
                <div class="font-bold">
                  {member ? getFullName(member) : "Icke inloggad"}
                </div>
                {#if consumable.externalCustomerEmail}
                  <div class="text-sm opacity-50">
                    {consumable.externalCustomerEmail}
                  </div>
                {/if}
              </div>
            </div>
          </td>
          <td>
            {dayjs(consumable.purchasedAt).format("HH:MM:SS DD-MM-YYYY")}
          </td>
          <td>
            {#if consumable.consumedAt}
              <span class="text-green-500">
                {dayjs(consumable.consumedAt).format("HH:MM:SS DD-MM-YYYY")}
              </span>
            {:else}
              <span class="">Ej konsumerad</span>
            {/if}
          </td>
          <td>
            <a
              class="link text-primary"
              href="{data.stripeIntentBaseUrl}/{consumable.stripeIntentId}"
            >
              {consumable.stripeIntentId}
            </a>
          </td>
          <th>
            <button class="btn btn-ghost">
              <span class="i-mdi-cash-refund text-xl text-success" />
            </button>
          </th>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
