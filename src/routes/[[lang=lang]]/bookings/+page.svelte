<script lang="ts">
  import BookableSelector from "./BookableSelector.svelte";
  // import SearchBar from "$lib/components/SearchBar.svelte";
  // import TagSelector from "$lib/components/TagSelector.svelte";
  import Calendar from "./Calendar.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<form
  method="get"
  class="form-control flex-1 flex-row items-center gap-2"
  id="create-form"
>
  <div class="join">
    <label>
      <BookableSelector allBookables={data.bookables} />
      <div class="flex flex-row">
        <input
          type="text"
          placeholder="Start"
          class="input input-bordered w-full max-w-xs"
        />
        <input
          type="text"
          placeholder="End"
          class="input input-bordered w-full max-w-xs"
        />
      </div>
      <button type="submit" class="btn btn-primary">Create</button>
    </label>
  </div>
</form>

<Calendar bookingRequests={data.bookingRequests} />
