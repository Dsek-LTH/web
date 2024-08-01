<script lang="ts">
  export let data;
  $: user = data.user;
  $: policies = user.policies.toSorted();
</script>

<section>
  <h1 class="text-lg font-semibold">User</h1>
  <span>{user.studentId}</span>
  <ul class="ml-4 list-disc text-sm">
    {#each policies as permission}
      <li>{permission}</li>
    {/each}
  </ul>
</section>

<section class="mt-4">
  <h1 class="text-lg font-semibold">Meta info</h1>
  <div>
    <b>Is nollning: {data.isNollning}</b>
  </div>
  <div>
    <b>Is app: {data.isApp}</b>
  </div>
  <div>
    <b>App info: {JSON.stringify(data.appInfo)}</b>
  </div>
</section>
