<script lang="ts">
  import map from "./map.webp";
  import cellar from "./cellar.webp";
  import floor1 from "./floor1.webp";
  import floor2 from "./floor2.webp";
  import floor3 from "./floor3.webp";
  import floor4 from "./floor4.webp";
  import * as m from "$paraglide/messages";
  import { page } from "$app/stores";
  let revealTheme = $derived($page.data["revealTheme"]);
</script>

<div class="flex flex-col md:flex-row">
  <img
    class="w-full max-w-sm {revealTheme ? '' : 'rounded-btn bg-black/20 p-4'}"
    alt="Map of campus"
    src={map}
  />
  <div
    class="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3 [&_h3]:text-center"
  >
    <div>
      <h3>{m.nollning_wikia_map_cellar()}</h3>
      <img
        class:invert={!revealTheme}
        class="w-full max-w-sm"
        alt="Map of campus"
        src={cellar}
      />
    </div>
    <div>
      <h3>{m.nollning_wikia_floor()} 1</h3>
      <img
        class:invert={!revealTheme}
        class="w-full max-w-sm"
        alt="Map of campus"
        src={floor1}
      />
    </div>
    <div>
      <h3>{m.nollning_wikia_floor()} 2</h3>
      <img
        class:invert={!revealTheme}
        class="w-full max-w-sm"
        alt="Map of campus"
        src={floor2}
      />
    </div>
    <div>
      <h3>{m.nollning_wikia_floor()} 3</h3>
      <img
        class:invert={!revealTheme}
        class="w-full max-w-sm"
        alt="Map of campus"
        src={floor3}
      />
    </div>
    <div>
      <h3>{m.nollning_wikia_floor()} 4</h3>
      <img
        class:invert={!revealTheme}
        class="w-full max-w-sm"
        alt="Map of campus"
        src={floor4}
      />
    </div>
  </div>
</div>
