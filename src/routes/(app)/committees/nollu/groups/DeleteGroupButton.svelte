<script lang="ts">
  import { enhance } from "$app/forms";
  import LoadingButton from "$lib/components/LoadingButton.svelte";

  interface Props {
    groupId: string;
  }

  let { groupId }: Props = $props();
  let isLoading = $state(false);
</script>

<form
  method="POST"
  action="?/delete"
  use:enhance={({ cancel }) => {
    if (!confirm("Är du säker på att du vill ta bort gruppen?")) {
      cancel();
    }
    let timeout = setTimeout(() => {
      isLoading = true;
    }, 500);
    return ({ update }) => {
      update();
      clearTimeout(timeout);
      isLoading = false;
    };
  }}
>
  <input type="hidden" name="id" value={groupId} />
  <LoadingButton
    type="submit"
    class="btn btn-square btn-error btn-sm"
    {isLoading}
  >
    <span class="i-mdi-trash"></span>
  </LoadingButton>
</form>
