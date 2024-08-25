<script lang="ts">
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import Message from "./Message.svelte";

  export let data;
  $: messages = data.messages;
</script>

<div class="md:text-center">
  <PageHeader title="Meddelanden" />
</div>

<div class="flex flex-col gap-4 md:max-w-xl md:mx-auto">
  {#each messages as message}
    <Message {message} />
  {/each}
</div>
