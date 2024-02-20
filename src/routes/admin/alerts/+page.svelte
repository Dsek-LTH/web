<script lang="ts">
</script>

<form method="POST" class="flex max-w-lg flex-col gap-2">
  <input
    type="text"
    placeholder="Meddelande Svenska"
    class="input input-bordered w-full"
  />
  <input
    type="text"
    placeholder="Meddelande Engelska"
    class="input input-bordered w-full"
  />
  <select class="select select-bordered w-full">
    <option disabled selected>Severity</option>
    <option>Info</option>
    <option>Success</option>
    <option>Warning</option>
    <option>Error</option>
  </select>
  <button class="btn">Create</button>
</form>
