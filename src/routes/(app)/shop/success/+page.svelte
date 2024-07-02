<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages";

  export let data;
</script>

<SetPageTitle title={m.cart_paymentStatus_pageTitle()} />

<h1 class="text-2xl font-bold">{data.message}</h1>
