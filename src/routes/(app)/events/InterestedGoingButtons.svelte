<script lang="ts">
  import { page } from "$app/stores";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";

  $: authorized = isAuthorized(apiNames.NEWS.LIKE, $page.data.user);
  $: isGoing = false;
</script>

<div class="my-3 flex flex-row gap-2">
  <div class="btn btn-outline btn-primary">
    <span class="i-mdi-check-circle-outline"></span>
    Kommer
  </div>
  <button disabled={!authorized} type="submit" class="">
    <label class="btn btn-outline swap flex flex-row">
      <input type="checkbox" disabled={!authorized} checked={isGoing} />
      <span class="swap-on i-mdi-check-circle size-6"></span>
      <span class="swap-off i-mdi-check-circle-outline size-6"></span>
      Kommer
    </label>
  </button>
  <div class="btn btn-ghost btn-secondary">
    <span class="i-mdi-star"></span>
    Intresserad
  </div>
</div>
