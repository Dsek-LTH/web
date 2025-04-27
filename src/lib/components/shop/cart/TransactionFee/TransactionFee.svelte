<script lang="ts">
  import Price from "$lib/components/Price.svelte";
  import * as m from "$paraglide/messages";
  import StripeDescription from "./StripeDescription.svelte";

  interface Props {
    fee: number;
  }

  let { fee }: Props = $props();
</script>

<tr class="hidden border-none md:table-row">
  <td>
    <StripeDescription />
  </td>
  <td class="font-medium"> {m.cart_transactionFee()} </td>
  <td class="text-right"> <Price price={fee} /></td>
  <td class="text-center"> </td>
  <th class="text-center"> </th>
</tr>

<tr class="border-none md:hidden">
  <td colspan="2">
    <StripeDescription />
  </td>
  <th></th>
</tr>
<tr class="border-none md:hidden">
  <td class="font-medium" colspan="2"> {m.cart_transactionFee()}</td>
  <td class="text-right">
    <Price price={fee} />
  </td>
</tr>
