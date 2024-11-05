<script lang="ts">
  import * as m from "$paraglide/messages";
  import slasque from "$lib/nollning/slasque.webp";
  import mixed from "$lib/nollning/mixed.webp";
  import suit from "$lib/nollning/suit.webp";
  import frack from "$lib/nollning/frack.webp";
</script>

<!-- eslint-disable svelte/no-at-html-tags -->
<section id="kladkod">
  <ul
    class="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4 [&>li>h6]:text-lg [&_h6]:font-semibold [&_i]:z-0 [&_i]:text-sm [&_i]:opacity-80 [&_img]:mb-2 [&_img]:rounded-box [&_img]:object-contain [&_p]:mt-2"
  >
    <li>
      <img width={1512} height={2016} src={slasque} alt="Slasque-exempel" />
      <h6>{@html m.nolla_packing_slasque()}</h6>
      <p>
        {@html m.nolla_packing_slasque_description()}
      </p>
    </li>
    <li>
      <img width={1512} height={2016} src={mixed} alt="Bruten kavaj exempel" />
      <h6>{@html m.nolla_packing_mixed_suit()}</h6>
      <p>
        {@html m.nolla_packing_mixed_suit_description()}
      </p>
    </li>
    <li>
      <img width={1512} height={2016} src={suit} alt="Mörk kostym exempel" />
      <h6>{@html m.nolla_packing_dark_suit()}</h6>
      <p>
        {@html m.nolla_packing_dark_suit_description()}
      </p>
    </li>
    <li>
      <img width={1512} height={2016} src={frack} alt="Högtidsdräktsexempel" />
      <h6>{@html m.nolla_packing_frack()}</h6>
      <p>{@html m.nolla_packing_frack_description()}</p>
    </li>
  </ul>
</section>
