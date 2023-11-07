<script lang="ts">
  import { enhance } from "$app/forms";
  import Labeled from "$lib/components/Labeled.svelte";
  import MemberSearch from "$lib/components/MemberSearch.svelte";

  export let onClose: () => void;
  const END_OF_YEAR = `${new Date().getFullYear()}-12-31`;
</script>

<form
  action="?/addMandate"
  method="POST"
  use:enhance={() => {
    return async ({ update }) => {
      onClose();
      await update();
    };
  }}
  class="form-control my-2 flex-row items-end gap-2"
>
  <div class="flex flex-1 flex-col items-stretch">
    <MemberSearch />
  </div>
  <Labeled label="Start" id="startDate">
    <input
      name="startDate"
      id="startDate"
      value={new Date().toISOString().substring(0, 10)}
      class="input input-bordered"
      type="date"
    />
  </Labeled>
  <Labeled label="End" id="endDate">
    <input
      name="endDate"
      id="endDate"
      value={END_OF_YEAR}
      class="input input-bordered"
      type="date"
    />
  </Labeled>
  <button type="submit" class="btn btn-secondary">Spara</button>
</form>
