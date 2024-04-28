<script lang="ts">
  import { enhance } from "$app/forms";
  import Price from "$lib/components/Price.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import type { Consumable, Member } from "@prisma/client";
  import type { SubmitFunction } from "@sveltejs/kit";
  import dayjs from "dayjs";

  export let stripeIntentBaseUrl: string;
  export let consumable: Consumable & {
    member: Member | null;
  };
  const enhanceMethod =
    (title: string): SubmitFunction =>
    ({ cancel }) => {
      if (!confirm(title)) cancel();
      return ({ update }) => {
        update();
      };
    };

  $: member = consumable.member;
</script>

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
    {dayjs(consumable.purchasedAt).format("HH:MM:ss DD-MM-YYYY")}
  </td>
  <td>
    {#if consumable.consumedAt}
      <span class="text-green-500">
        {dayjs(consumable.consumedAt).format("HH:MM:ss DD-MM-YYYY")}
      </span>
    {:else}
      <span class="">Ej konsumerad</span>
    {/if}
  </td>
  <td>
    {#if consumable.priceAtPurchase}
      <Price price={consumable.priceAtPurchase} />
    {:else}
      <span>Okänt</span>
    {/if}
  </td>
  <td>
    {#if consumable.stripeIntentId}
      <a
        class="link text-primary"
        href="{stripeIntentBaseUrl}/{consumable.stripeIntentId}"
      >
        {consumable.stripeIntentId}
      </a>
    {:else}
      <span>Betalade ej</span>
    {/if}
  </td>
  <th>
    {#if consumable.consumedAt === null}
      <form method="POST" action="?/consume" use:enhance>
        <input type="hidden" name="consumableId" value={consumable.id} />
        <button class="btn btn-ghost">
          <span class="i-mdi-flame-circle text-xl text-secondary" />
        </button>
      </form>
    {:else}
      <form
        method="POST"
        action="?/unconsume"
        use:enhance={enhanceMethod(
          "Är du säker på att du vill avkonsumera biljetten?",
        )}
      >
        <input type="hidden" name="consumableId" value={consumable.id} />
        <button class="btn btn-ghost">
          <span class="i-mdi-redo-variant text-xl text-error" />
        </button>
      </form>
    {/if}
  </th>
  <th>
    <form
      method="POST"
      action="?/refund"
      use:enhance={enhanceMethod(
        "Är du säker på att du vill ge personen en återbetalning?",
      )}
    >
      <input type="hidden" name="consumableId" value={consumable.id} />
      <button class="btn btn-ghost">
        <span class="i-mdi-cash-refund text-xl text-success" />
      </button>
    </form>
  </th>
</tr>
