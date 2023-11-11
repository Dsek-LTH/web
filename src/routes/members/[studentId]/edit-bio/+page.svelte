<script lang="ts">
  import { enhance } from "$app/forms";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/member";
  import { page } from "$app/stores";

  export let data;
  export let form;
  $: member = data.member;
</script>

<svelte:head>
  <title>Bio - {getFullName($page.data.session?.user, member)} | D-sektionen</title>
</svelte:head>
<header class="flex gap-4">
  <MemberAvatar {member} class="w-32 rounded-lg" />
  <div class="flex flex-col">
    <h1 class="text-3xl font-bold">{getFullName($page.data.session?.user, member)}</h1>
    {member.studentId}
  </div>
</header>
<div class="mt-4 grid gap-2 md:grid-cols-2">
  <form
    id="edit-member"
    method="POST"
    action="?/update"
    use:enhance={() =>
      async ({ update }) => {
        await update({ reset: false });
      }}
    class="form-control gap-2"
  >
    {#if form?.success}
      <p class="text-success">Uppdaterad!</p>
    {:else if form?.error}
      <p class="text-error">{form.error}</p>
    {/if}
    <button type="submit" class="btn btn-secondary">Spara</button>
    <textarea
      id="bio"
      name="bio"
      class="textarea min-h-[20rem] rounded-none p-0"
      placeholder="Bio"
      bind:value={member.bio}
    />
  </form>
  <div>
    <h2 class="py-3 text-xl italic">Preview</h2>
    <MarkdownBody body={member.bio ?? ""} />
  </div>
</div>
