<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import { page } from "$app/stores";
  import { superForm } from "sveltekit-superforms/client";

  export let data;
  $: member = data.member;
  const { form, errors, constraints, enhance } = superForm(data.form);
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
  <form id="edit-member" method="POST" action="?/update" use:enhance class="form-control gap-2">
    <button type="submit" class="btn btn-secondary">Spara</button>
    {#if $errors.bio}
      <p class="text-error">{$errors.bio}</p>
    {/if}
    <textarea
      id="bio"
      name="bio"
      class="textarea min-h-[20rem] rounded-none p-0"
      placeholder="Bio"
      bind:value={$form.bio}
      {...$constraints.bio}
    />
  </form>
  <div>
    <h2 class="py-3 text-xl italic">Preview</h2>
    <MarkdownBody body={$form.bio ?? ""} />
  </div>
</div>
