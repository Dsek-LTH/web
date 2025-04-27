<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import TicketForm from "$lib/components/shop/TicketForm.svelte";
  let { data } = $props();
</script>

<SetPageTitle title="Uppdatera biljett" />

<TicketForm form={data.form} event={data.event} type="edit" />
