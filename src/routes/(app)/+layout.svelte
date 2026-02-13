<script>
  import Toast from "../Toast.svelte";
  import Alert from "$lib/components/Alert.svelte";
  import { languageTag } from "$paraglide/runtime";
  import Footer from "./Footer.svelte";
  import Navbar from "./Navbar.svelte";

  const { data, children } = $props();
</script>

<Navbar />

{#each data.alerts as alert (alert.id)}
  {#if !alert.closedByMember.some((member) => member.id === data.member?.id)}
    <Alert
      id={alert.id}
      message={languageTag() === "sv" ? alert.messageSv : alert.messageEn}
      severity={alert.severity}
    />
  {/if}
{/each}

{@render children?.()}
<Toast />
<Footer />
