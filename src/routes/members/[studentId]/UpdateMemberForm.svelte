<script lang="ts">
  import { enhance } from "$app/forms";
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import type { Member } from "@prisma/client";
  import { _classProgrammes } from "./data";
  import type { ActionData } from "./$types";
  export let isEditing;
  export let form: ActionData;
  export let member: Member;
</script>

<form
  id="edit-member"
  method="POST"
  action="?/update"
  use:enhance={() =>
    async ({ update }) => {
      await update({ reset: false });
      isEditing = false;
    }}
  class="form-control gap-2"
>
  <div class="flex gap-2 [&>*]:flex-1">
    <Input name="firstName" label="First name" value={form?.data?.firstName ?? member.firstName} />
    <Input name="nickname" label="Nickname" value={form?.data?.nickname ?? member.nickname} />
    <Input name="lastName" label="Last name" value={form?.data?.lastName ?? member.lastName} />
  </div>
  <div class="flex gap-2 [&>*:nth-child(3)]:flex-1">
    <Labeled label="Program" id="classProgramme">
      <select
        id="classProgramme"
        name="classProgramme"
        class="select select-bordered w-full max-w-xs"
        value={form?.data?.classProgramme ?? member.classProgramme ?? "D"}
        required
      >
        {#each _classProgrammes as programme (programme.id)}
          <option value={programme.id}>{programme.name}</option>
        {/each}
      </select>
    </Labeled>
    <Labeled label="Year" id="classProgramme">
      <input
        type="number"
        min="1982"
        max={new Date().getFullYear()}
        name="classYear"
        id="classYear"
        class="input input-bordered"
        value={form?.data?.classYear ?? member.classYear ?? new Date().getFullYear()}
      />
    </Labeled>
    <Input
      name="foodPreference"
      label="Matpreferens"
      value={form?.data?.foodPreference ?? member.foodPreference ?? ""}
    />
  </div>
  <button type="submit" class="btn btn-secondary mt-4">Spara</button>
  {#if form?.error}
    <span class="text-error">{form.error}</span>
  {/if}
</form>
