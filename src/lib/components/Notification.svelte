<script lang="ts">
  const handleDelete = () => {
    console.log("Deleting notification");
  };

  const handleClick = () => {
    console.log("Clicking on notification");
  };
</script>

<div>
  <button class="btn btn-ghost" on:click={handleClick}>
    Notification text
  </button>
  <button class="btn btn-ghost *:text-2xl" on:click={handleDelete}>
    <span class="i-mdi-delete-outline"></span>
  </button>
</div>
