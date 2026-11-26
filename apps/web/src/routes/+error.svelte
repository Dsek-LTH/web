<script lang="ts">
  import { page } from "$app/state";
  import { Button } from "$lib/components/ui/button";
  import { codeToMessage } from "$lib/utils/codeToMessage";
  import * as m from "$paraglide/messages";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Footer from "./(app)/Footer.svelte";
  import Bug from "@lucide/svelte/icons/bug";
  import Mail from "@lucide/svelte/icons/mail";
  import AppNavigation from "./(app)/AppNavigation.svelte";
  import Header from "./(app)/Header.svelte";
  import AppHeader from "./(app)/AppHeader.svelte";
  import { signIn } from "$lib/utils/auth";
  import LogIn from "@lucide/svelte/icons/log-in";

  // Not being logged in or allowed is an answer, not a bug.
  const expected = $derived(page.status === 401 || page.status === 403);
</script>

{#if page.data.isApp}
  <AppHeader />
  <AppNavigation />
{:else}
  <Header unreadCount={page.data["unreadCount"]} />
{/if}
<main
  style:padding-top={page.data.isApp ? "64px" : "0px"}
  class="layout-container inline-flex flex-col gap-4 text-center"
>
  <div>
    <h1>{page.status}</h1>

    {#if page.error?.message}
      <h5>{page.error.message}</h5>
    {:else if page.error?.statusDescription ?? page.status in codeToMessage}
      <h5>{codeToMessage[page.status]}</h5>
    {/if}
  </div>

  <div>
    {#if page.status === 401}
      <Button variant="rosa" onclick={signIn}>
        <LogIn />{m.navbar_logIn()}
      </Button>
    {/if}
    <Button variant="lila" onclick={() => history.back()}>
      <ArrowLeft />{m.back()}
    </Button>
  </div>
  {#if !expected}
    <div>
      <div>{m.error_should_not_happen()}</div>
      <div class="inline-flex flex-row items-center">
        <Button
          variant="ghost"
          href="https://github.com/Dsek-LTH/web/issues/new/choose"
        >
          <Bug />{m.error_create_issue()}</Button
        >

        <span>{m.error_or()}</span>
        <Button variant="ghost" href="mailto:dwww@dsek.se"
          ><Mail />{m.error_contact()}</Button
        >
      </div>
    </div>
  {/if}
</main>
{#if !page.data.isApp}
  <Footer />
{/if}
