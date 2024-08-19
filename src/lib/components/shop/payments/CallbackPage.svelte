<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { invalidate } from "$app/navigation";
  import * as m from "$paraglide/messages";
  import { onDestroy, onMount } from "svelte";

  export let data: {
    refreshPeriodically?: boolean;
    message: string;
  };

  let interval: ReturnType<typeof setInterval>;
  $: if (data.refreshPeriodically) {
    onMount(() => {
      interval = setInterval(() => {
        invalidate("cart-success-page");
      }, 1000);
    });
    onDestroy(() => {
      if (interval) clearInterval(interval);
    });
  } else if (interval) {
    clearInterval(interval);
  }
</script>

<SetPageTitle title={m.cart_paymentStatus_pageTitle()} />

<h1 class="text-2xl font-bold">{data.message}</h1>
{#if interval}
  <span class="loading" />
{/if}
