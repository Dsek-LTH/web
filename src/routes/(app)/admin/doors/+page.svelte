<script lang="ts">
  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<div class="overflow-x-auto">
  <table class="table">
    <!-- head -->
    <thead>
      <tr class="bg-base-200">
        <th>Door</th>
        <th />
      </tr>
    </thead>
    <tbody>
      {#each data.doors as door (door.name)}
        <tr>
          <td class="font-medium">
            {door.verboseName}
          </td>
          <td class="text-right">
            <a class="btn btn-xs px-8" href="doors/edit/{door.name}">Edit</a>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
