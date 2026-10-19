<script lang="ts">
  import type { PageData } from "./$types.js";
  import BookingsForm from "$lib/bookings/components/BookingsForm.svelte";

  let { data }: { data: PageData } = $props();
</script>

<BookingsForm {data} />
