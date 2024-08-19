<script lang="ts">
  import { enhance } from "$app/forms";

  export let itemId: string;
</script>

<form method="POST" action="?/removeItem" use:enhance>
  <input type="hidden" name="id" value={itemId} />
  <button type="submit" class="btn btn-ghost">
    <span class="i-mdi-trash-can text-xl" />
  </button>
</form>
