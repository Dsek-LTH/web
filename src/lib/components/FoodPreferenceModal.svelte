<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import * as m from "$paraglide/messages";
  import Input from "$lib/components/Input.svelte";

  $: member = $page.data.member;
  $: shouldAskUserForFoodPreference = member && member.foodPreference == null;
  let modal: HTMLDialogElement;
  let mounted = false;

  onMount(() => {
    mounted = true;
    if (shouldAskUserForFoodPreference) {
      modal.showModal();
    } else {
      modal.close();
    }
  });

  $: if (mounted) {
    if (shouldAskUserForFoodPreference) {
      modal.showModal();
    } else {
      modal.close();
    }
  }

  let hasFoodPreference = false;
</script>

{#if member}
  <dialog class="modal" bind:this={modal}>
    <div class="modal-box">
      <h3 class="text-lg font-bold">{m.tickets_foodPreferenceModal_title()}</h3>
      {#if !hasFoodPreference}
        <p class="py-4">
          {m.tickets_foodPreferenceModal_preferenceInitialQuestion()}
        </p>
        <div class="flex gap-4">
          <form
            method="POST"
            action="/members/{member.studentId}?/updateFoodPreference"
            use:enhance
            class="flex-1"
          >
            <input type="hidden" name="foodPreference" value="" />
            <button type="submit" class="btn btn-error w-full">{m.no()}</button>
          </form>
          <button
            class="btn btn-primary flex-1"
            on:click={() => (hasFoodPreference = true)}>{m.yes()}</button
          >
        </div>
      {:else}
        <p class="pt-4">{m.tickets_foodPreferenceModal_preferenceQuestion()}</p>
        <form
          method="POST"
          action="/members/{member.studentId}?/updateFoodPreference"
          use:enhance
          class="mb-8 mt-2 flex items-end gap-2 [&>*:first-child]:flex-1"
        >
          <Input
            name="foodPreference"
            label={m.member_foodPreference()}
            placeholder="laktos,vegetarian,gluten..."
            required
          />
          <button type="submit" class="btn btn-primary">
            {m.save()}
          </button>
        </form>
        <form
          method="POST"
          action="/members/{member.studentId}?/updateFoodPreference"
          use:enhance
        >
          <input type="hidden" name="foodPreference" value="" />
          <button type="submit" class="btn btn-error">
            {m.tickets_foodPreferenceModal_iDontHaveAPreference()}
          </button>
        </form>
      {/if}
    </div>
  </dialog>
{/if}
