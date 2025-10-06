<script lang="ts">
  import ClassBadge from "$lib/components/ClassBadge.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import UpdateMandateForm from "./UpdateMandateForm.svelte";
  import DeleteMandateForm from "./DeleteMandateForm.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import { getFullName } from "$lib/utils/client/member";
  import { languageTag } from "$paraglide/runtime";
  import type { Prisma } from "@prisma/client";
  import type { PageData } from "./$types";
  import { onMount } from "svelte";
  export let data: PageData;
  export let mandate: PageData["mandates"][0];

  let isEditing = false;
  let container: Node;

  onMount(() =>
    document.addEventListener("pointerdown", (event) => {
      if (!container.contains(event.target as Node)) {
        isEditing = false;
      }
    }),
  );
</script>

<div
  bind:this={container}
  class="tooltip relative flex items-center gap-2"
  data-tip={getFullName(mandate.member) +
    `\n${mandate.startDate.toLocaleDateString(
      languageTag(),
    )} - ${mandate.endDate.toLocaleDateString(languageTag())}`}
>
  <a
    href="/members/{mandate.member.studentId}"
    class="flex flex-1 place-items-center gap-2 overflow-hidden normal-case"
  >
    <MemberAvatar member={mandate.member} />
    <span
      class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left font-medium"
    >
      {getFullName(mandate.member)}
    </span>
  </a>
  <ClassBadge member={mandate.member} />
  {#if isAuthorized(apiNames.MANDATE.UPDATE, data.user)}
    <button
      class="aspect-square h-full"
      on:click={() => (isEditing = !isEditing)}
      ><span class="h-full w-full i-mdi-{isEditing ? 'close' : 'pen'}"
        >edit</span
      ></button
    >
  {/if}

  {#if isEditing}<div class="absolute top-full z-10 bg-gray-600 text-green-500">
      {#await data.updateMandateForm then form}
        <UpdateMandateForm data={form} mandateId={mandate.id} />
      {/await}
      {#if isAuthorized(apiNames.MANDATE.DELETE, data.user)}
        {#await data.deleteMandateForm then form}
          <DeleteMandateForm mandateId={mandate.id} data={form} />
        {/await}
      {/if}
      <span class="text-xs">
        {mandate.startDate.toLocaleDateString(languageTag())} - {mandate.endDate.toLocaleDateString(
          languageTag(),
        )}
      </span>
    </div>{/if}

  <!-- Remove and edit buttons -->
  {#if isEditing && false}
    <!--{#if isAuthorized(apiNames.MANDATE.UPDATE, data.user)}
      <button
        class="btn btn-secondary btn-sm pointer-events-auto"
        on:click|preventDefault={async () => {
          await goto(`positions/${data.position.id}?editMandate=${mandate.id}`);
        }}
      >
        {m.positions_edit()}
      </button>
    {/if}-->
  {:else}{/if}
  {#if isEditing && false}{/if}
</div>
