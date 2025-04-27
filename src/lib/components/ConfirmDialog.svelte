<!--
  @component

  This component shows a confirmation dialog with a `title`, `description`,
  and two buttons. For a basic HTML dialog form, you can use the `formTarget`
  and `formData` props to submit a form with a confirm button.
  
  If you need to customize the dialog, you can use the slots to
  provide a custom `title`, `description`, and `action` buttons.

  @slot `title`
    The title of the dialog. Defaults to `h1`
  
  @slot `description`
    The description of the dialog. Defaults to `p`
  
  @slot `action`
    The action buttons of the dialog. Defaults to two buttons:
    - A cancel button that closes the dialog
    - A confirm button in a form that submits the form and closes the dialog

-->
<script lang="ts">
  import { enhance } from "$app/forms";
  import * as m from "$paraglide/messages";
  import type { Snippet } from "svelte";
  import { twMerge } from "tailwind-merge";

  interface Props {
    /** The title of the dialog displayed at the top. */
    title?: Snippet | string;
    /** The description of the dialog displayed below the title. */
    description?: Snippet | string;
    /** The text of the confirm button. */
    confirmText?: string;
    /** The text of the cancel button. */
    cancelText?: string;
    /** The target URL for the confirm button. */
    formTarget?: string | undefined;
    /** The form data to submit with the confirm button. */
    formData?: Record<string, string>;
    /** Not recommended. Prefer using `formTarget` and `formData`. */
    onClose?: (() => void) | undefined;
    /** Not recommended. Prefer using `formTarget` and `formData`. */
    onConfirm?: (() => void) | undefined;
    /** Classes to apply to the confirm button. */
    confirmClass?: string | undefined;
    /** The dialog element. */
    modal: HTMLDialogElement;
    action?: Snippet;
  }

  let {
    confirmText = m.ok(),
    cancelText = m.cancel(),
    formTarget = undefined,
    formData = {},
    onClose = undefined,
    onConfirm = undefined,
    confirmClass = undefined,
    modal = $bindable(),
    title = "Are you sure?",
    description = "",
    action = undefined,
  }: Props = $props();
</script>

<dialog bind:this={modal} class="modal modal-bottom sm:modal-middle">
  <div class="modal-box">
    {#if title && typeof title === "function"}
      {@render title()}
    {:else}
      <h1 class="mb-4 text-lg font-bold">{title}</h1>
    {/if}

    {#if description && typeof description === "function"}
      {@render description()}
    {:else}
      <p>{description}</p>
    {/if}

    <div class="modal-action">
      {#if action}{@render action()}{:else}
        <button
          class="btn"
          onclick={() => {
            modal?.close();
            onClose?.();
          }}
        >
          {cancelText}
        </button>
        <form method="POST" action={formTarget} use:enhance>
          {#each Object.entries(formData) as [name, value]}
            <input type="hidden" {name} {value} />
          {/each}
          <button
            type="submit"
            class={twMerge("btn btn-primary", confirmClass)}
            onclick={() => {
              modal?.close();
              onConfirm?.();
            }}
          >
            {confirmText}
          </button>
        </form>
      {/if}
    </div>
  </div>

  <!-- svelte-ignore a11y_consider_explicit_label -->
  <form method="dialog" class="modal-backdrop">
    <button class="cursor-auto"></button>
  </form>
</dialog>
