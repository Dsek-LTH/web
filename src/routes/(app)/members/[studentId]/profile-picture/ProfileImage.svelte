<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import type { ChangeSchema, DeleteSchema } from "./+page.server";
  import { superForm } from "sveltekit-superforms/client";

  export let fileName: string;
  export let url: string;
  export let current = false;
  export let changeForm: SuperValidated<ChangeSchema>;
  export let deleteForm: SuperValidated<DeleteSchema>;
  const { errors: changeErrors, enhance: changeEnhance } = superForm(
    changeForm,
    {
      id: `change-${fileName}`,
    },
  );
  const { errors: deleteErrors, enhance: deleteEnhance } = superForm(
    deleteForm,
    {
      id: `delete-${fileName}`,
    },
  );
</script>

<div class="relative">
  <form method="POST" action="?/change" use:changeEnhance>
    <input type="hidden" value={url} name="url" />
    {#if $changeErrors.url}
      <p class="text-error">{$changeErrors.url}</p>
    {/if}
    <button type="submit">
      <div
        class="avatar overflow-hidden rounded-full border-8 {current
          ? 'border-primary'
          : 'border-transparent'}"
      >
        <figure class="relative w-48">
          <img
            src={url}
            alt="Profile avatar option, {current ? 'currently selected' : ''}"
          />
        </figure>
      </div>
    </button>
  </form>

  <form method="POST" action="?/delete" use:deleteEnhance>
    <input type="hidden" value={fileName} name="fileName" />
    {#if $deleteErrors.fileName}
      <p class="text-error">{$deleteErrors.fileName}</p>
    {/if}
    <button
      class="btn btn-square btn-secondary btn-sm absolute bottom-1 right-1"
    >
      <span class="i-mdi-delete" />
    </button>
  </form>
</div>
