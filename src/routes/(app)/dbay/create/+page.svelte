<script lang="ts">
</script>

<form
  method="POST"
  class="flex w-full flex-col items-center gap-2"
  action="?/create"
>
  <p>Dbay Post</p>
  <input
    type="text"
    name="header"
    placeholder="Header"
    class="input input-bordered w-full max-w-lg"
  />
  <input
    type="text"
    name="body"
    placeholder="Body"
    class="input input-bordered w-full max-w-lg"
  />
  <input
    type="number"
    name="price"
    placeholder="Price"
    class="input input-bordered w-full max-w-lg"
  />
  <button class="btn w-full max-w-lg">Submit</button>
</form>
