<script lang="ts">
  import * as m from "$paraglide/messages";
  export let isEditing: boolean;
</script>

<button
  class="btn"
  on:click={() => {
    isEditing = !isEditing;
  }}
>
  {isEditing ? m.members_cancel() : m.members_edit()}
</button>
