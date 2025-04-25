<script lang="ts">
  import MemberBio from "../MemberBio.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import { superForm } from "$lib/utils/client/superForms";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let member = $derived(data.member);
  const { form, errors, constraints, enhance } = superForm(data.form);
</script>

<SetPageTitle title="Bio - {getFullName(member)}" />
<header class="flex gap-4">
  <MemberAvatar {member} class="w-32 rounded-lg" />
  <div class="flex flex-col">
    <h1 class="text-3xl font-bold">
      {getFullName(member)}
    </h1>
    {member.studentId}
  </div>
</header>
<div class="mt-4 grid gap-2 md:grid-cols-2">
  <form
    id="edit-member"
    method="POST"
    action="?/update"
    use:enhance
    class="form-control gap-2"
  >
    <button type="submit" class="btn btn-primary">{m.members_save()}</button>
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
    ></textarea>
  </form>
  <div>
    <h2 class="py-3 text-xl italic">{m.members_preview()}</h2>
    <MemberBio bio={$form.bio ?? ""} />
  </div>
</div>
