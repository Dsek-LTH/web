<script lang="ts">
  import type { PageData } from "./$types";
  import dbayGIF from "../dbay.gif";

  export let data: PageData;
  const { dbay } = data;
</script>

<div class="layout-container">
  <div class="rounded-lg bg-base-200 p-2">
    <figure>
      <img class="mx-auto" src={dbayGIF} alt={dbay.header} />
    </figure>
    <h1 class="text-2xl font-bold">{dbay.header}</h1>
    <p class="text-primary">{dbay.price} kr</p>
    <p class="">{dbay.body}</p>
  </div>
</div>
