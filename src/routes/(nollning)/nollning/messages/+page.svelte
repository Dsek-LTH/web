<script lang="ts">
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import Message from "./Message.svelte";
  import * as m from "$paraglide/messages";

  export let data;
  $: messages = data.messages;
</script>

<div class="md:text-center">
  <PageHeader title={m.messages()} />
</div>

<div class="flex flex-col gap-4 md:mx-auto md:max-w-xl">
  {#each messages as message}
    <Message {message} />
  {/each}
</div>
