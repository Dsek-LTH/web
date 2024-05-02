<script lang="ts">
  import { page } from "$app/stores";

  import MyProfilePage from "./MyProfilePage.svelte";
  export let data;
  $: isMe = data.user?.studentId === $page.params["studentId"];
</script>

{#if isMe}
  <MyProfilePage {data} />
{:else}
  <MyProfilePage {data} />
{/if}
