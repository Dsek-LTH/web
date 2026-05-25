<script lang="ts">
  import Toast from "../Toast.svelte";
  import Alert from "$lib/components/Alert.svelte";
  import Footer from "./Footer.svelte";
  import Navbar from "./Navbar.svelte";
  import { getLocale } from "$paraglide/runtime";

  const { data, children } = $props();
</script>

<div class="flex min-h-screen flex-col">
  <Navbar notificationsPromise={data.notificationsPromise} />

  <main class="flex min-h-0 flex-1 flex-col">
    {#each data.alerts as alert (alert.id)}
      {#if !alert.closedByMember.some((member) => member.id === data.member?.id)}
        <Alert
          id={alert.id}
          message={getLocale() === "sv" ? alert.messageSv : alert.messageEn}
          severity={alert.severity}
        />
      {/if}
    {/each}

    {@render children?.()}
  </main>

  <Toast />
  <Footer />
</div>
