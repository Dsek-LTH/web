<script lang="ts">
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import Message from "./Message.svelte";

  export let data;
  $: messages = data.messages;
</script>

<PageHeader title="Meddelanden" />

<div class="flex flex-col gap-4">
  {#each messages as message}
    <Message {message} />
  {/each}
</div>
