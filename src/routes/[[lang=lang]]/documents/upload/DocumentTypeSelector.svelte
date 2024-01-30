<script lang="ts">
  export let type: string;
</script>

<ul class="xyz flex flex-wrap gap-4">
  <li class="flex-1">
    <input
      type="radio"
      id="meeting"
      name="type"
      value="meeting"
      class="peer hidden"
      bind:group={type}
    />
    <label
      for="meeting"
      class="flex cursor-pointer rounded-lg border border-base-content/20 p-5 peer-checked:border-primary peer-checked:bg-primary/10"
    >
      <div class="flex gap-4">
        <span class="i-mdi-document self-center text-2xl" />
        <div>
          <p class="text-lg font-semibold">Möteshandling</p>
          <p class="text-gray-400">Sektionsmöten, styrelsemöten</p>
        </div>
      </div>
    </label>
  </li>

  <li class="flex-1">
    <input
      type="radio"
      id="srd"
      name="type"
      value="srd"
      class="peer hidden"
      bind:group={type}
    />
    <label
      for="srd"
      class="flex cursor-pointer rounded-lg border border-base-content/20 p-5 peer-checked:border-primary peer-checked:bg-primary/10"
    >
      <div class="flex gap-4">
        <span class="i-mdi-account-student self-center text-2xl" />
        <div>
          <p class="text-lg font-semibold">Studierådet</p>
          <p class="text-gray-400">Möteshandlingar för SRD</p>
        </div>
      </div>
    </label>
  </li>

  <li class="flex-1">
    <input
      type="radio"
      id="requirement"
      name="type"
      value="requirement"
      class="peer hidden"
      bind:group={type}
    />
    <label
      for="requirement"
      class="flex cursor-pointer rounded-lg border border-base-content/20 p-5 peer-checked:border-primary peer-checked:bg-primary/10"
    >
      <div class="flex gap-4">
        <span class="i-mdi-format-list-bulleted-type self-center text-2xl" />
        <div>
          <p class="text-lg font-semibold">Kravprofiler</p>
          <p class="text-gray-400">Kravprofiler för poster</p>
        </div>
      </div>
    </label>
  </li>
</ul>

<!-- <style>
  .xyz {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
</style> -->
