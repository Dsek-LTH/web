<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import TicketForm from "$lib/components/shop/TicketForm.svelte";

  export let data;
</script>

<SetPageTitle title="Skapa biljett" />

<TicketForm form={data.form} />
