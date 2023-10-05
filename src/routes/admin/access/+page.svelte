<script lang="ts">
  export let data;
  const uniqueApiNames = data.allPolicies
    .map((policy) => policy.apiName)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();
</script>

<div class="overflow-x-auto">
  <table class="table">
    <!-- head -->
    <thead>
      <tr class="bg-base-200">
        <th>Policy code</th>
        <th />
      </tr>
    </thead>
    <tbody>
      {#each uniqueApiNames as apiName}
        <tr>
          <td>{apiName}</td>
          <td class="text-right"><a class="btn btn-xs px-8" href="access/{apiName}">Edit</a></td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<ul></ul>
