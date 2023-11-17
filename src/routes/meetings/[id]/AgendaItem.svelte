<script lang="ts">
  import type { MeetingAgendaItem, MeetingAttachment } from "@prisma/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";
  import type { UpdateItemSchema } from "./+page.server";
  import { page } from "$app/stores";
  import apiNames from "$lib/utils/apiNames";

  export let previousItem: Pick<MeetingAgendaItem, "concluded"> | undefined;
  export let item: MeetingAgendaItem & { attachments: MeetingAttachment[] };
  export let data: SuperValidated<UpdateItemSchema>;
  const { form, enhance } = superForm(data, {
    id: item.id,
  });
  $: (() => {
    $form = { ...item };
  })();
  let formEl: HTMLFormElement;
  $: isCurrentItem = !item.concluded && (previousItem == undefined || previousItem.concluded);
  $: canEdit = $page.data.accessPolicies.includes(apiNames.MEETINGS.UPDATE);
</script>

<li class="step" class:step-secondary={isCurrentItem} class:step-primary={$form.concluded}>
  <form method="POST" action="?/updateItem" use:enhance class="w-full" bind:this={formEl}>
    <input type="hidden" name="id" value={item.id} />
    <label class="label flex w-full max-w-lg justify-between" class:cursor-pointer={canEdit}>
      <span class="label-text">{item.title}</span>
      {#if canEdit}
        <input
          type="checkbox"
          name="concluded"
          bind:checked={$form.concluded}
          class="checkbox-secondary checkbox"
          on:change={() => {
            formEl.requestSubmit();
          }}
        />
      {/if}
    </label>
  </form>
</li>
