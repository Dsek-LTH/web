<script lang="ts">
  import { enhance } from "$app/forms";

  export let url: string;
  export let current: boolean = false;
</script>

<form method="POST" action="?/change" use:enhance>
  <input type="hidden" value={url} name="url" />
  <button type="submit">
    <div
      class="avatar overflow-hidden rounded-full border-8 {current
        ? 'border-primary'
        : 'border-transparent'}"
    >
      <figure class="relative w-48">
        <img src={url} alt="Profile avatar option, {current ? 'currently selected' : ''}" />
      </figure>
    </div>
  </button>
</form>
