<script lang="ts">
  import CallbackPage from "$lib/components/shop/payments/CallbackPage.svelte";

  let { data } = $props();
</script>

<CallbackPage {data} />
