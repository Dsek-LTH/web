<script lang="ts">
  export let isEditing: boolean;
</script>

<button
  class="btn"
  on:click={() => {
    isEditing = !isEditing;
  }}
>
  {isEditing ? "Avbryt" : "Redigera"}
</button>
