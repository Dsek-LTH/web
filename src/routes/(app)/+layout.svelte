<script lang="ts">
  import Toast from "../Toast.svelte";
  import Alert from "$lib/components/Alert.svelte";
  import Header from "./Header.svelte";
  import Footer from "./Footer.svelte";
  import { getLocale } from "$paraglide/runtime";
  import { page } from "$app/state";

  const { data, children } = $props();
</script>

<div
  class="flex min-h-screen flex-col"
  style:padding-top={(data.isApp
    ? (page.data.appInfo?.insets?.top ?? 0) + 8
    : 0) + "px"}
  style:padding-bottom={(data.isApp
    ? (page.data.appInfo?.insets?.bottom ?? 0) + 64
    : 0) + "px"}
>
  <Header notificationsPromise={data.notificationsPromise} isApp={data.isApp} />

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
  {#if !data.isApp}
    <Footer />
  {/if}
</div>
