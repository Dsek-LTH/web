<script lang="ts">
  import BookableSelector from "$lib/components/BookableSelector.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import Calendar from "./Calendar.svelte";

  export let data;
</script>

<form method="get" class="form-control flex-1 flex-row items-center gap-2" id="create-form">
  <div class="join">
    <label>
      <SearchBar />
      <BookableSelector allBookables={data.bookables} />
      <input type="" name="past" />
    </label>
  </div>
</form>

<Calendar bookingRequests={data.bookingRequests} />
