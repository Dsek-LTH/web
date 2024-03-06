<script lang="ts">
  import { page } from "$app/stores";

  import type { PageData } from "./$types";
  import MyProfilePage from "./MyProfilePage.svelte";
  export let data: PageData;
  $: isMe = data.user?.studentId === $page.params["studentId"];
</script>

{#if isMe}
  <MyProfilePage {data} />
{:else}
  <MyProfilePage {data} />
{/if}
