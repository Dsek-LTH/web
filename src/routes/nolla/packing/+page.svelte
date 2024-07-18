<script lang="ts">
  import * as m from "$paraglide/messages";
</script>

<!-- eslint-disable svelte/no-at-html-tags -->
<header class=" max-w-prose">
  <h1 class="nolla-page-title">
    {@html m.nolla_packing_header()}
  </h1>
</header>

<article class=" max-w-prose">
  <p>
    {@html m.nolla_packing_description()}
  </p>
  <ul
    class="ml-4 flex list-outside list-disc flex-col gap-4 [&>li>b]:inline-block [&>li>b]:font-semibold [&>li>p]:mt-0 [&>li>p]:text-sm [&>li>p]:italic"
  >
    <li>
      <b>{@html m.nolla_packing_robust_clothing()}</b>
      <p>
        {@html m.nolla_packing_robust_clothing_description()}
      </p>
    </li>
    <li>
      <b>{@html m.nolla_packing_theme_outfits()}</b>
      <p>
        {@html m.nolla_packing_theme_outfits_description()}
      </p>
    </li>
    <li>
      <b>{@html m.nolla_packing_fancy_clothing()}</b>
      <p>
        {@html m.nolla_packing_fancy_clothing_description()}
      </p>
    </li>
    <li>
      <b>{@html m.nolla_packing_happy_mood()}</b>
    </li>
  </ul>
</article>

<section id="kladkod" class="my-16">
  <ul
    class="neo-brutal-box grid grid-cols-1 gap-2 bg-primary md:grid-cols-2 xl:grid-cols-4 [&>li>h6]:text-lg [&>li>h6]:font-semibold [&>li>img]:object-contain [&>li>p>i]:text-sm [&>li>p>i]:opacity-80"
  >
    <li>
      <img
        src="https://www.afbostader.se/globalassets/bostadsomraden/pireus/pf_bsflb.jpg"
        alt="Slasque-exempel"
      />
      <h6>{@html m.nolla_packing_slasque()}</h6>
      <p>
        {@html m.nolla_packing_slasque_description()}
      </p>
    </li>
    <li>
      <img
        src="https://www.afbostader.se/globalassets/bostadsomraden/pireus/pf_bsflb.jpg"
        alt="Bruten kavaj exempel"
      />
      <h6>{@html m.nolla_packing_mixed_suit()}</h6>
      <p>
        {@html m.nolla_packing_mixed_suit_description()}
      </p>
    </li>
    <li>
      <img
        src="https://www.afbostader.se/globalassets/bostadsomraden/pireus/pf_bsflb.jpg"
        alt="Mörk kostym exempel"
      />
      <h6>{@html m.nolla_packing_dark_suit()}</h6>
      <p>
        {@html m.nolla_packing_dark_suit_description()}
      </p>
    </li>
    <li>
      <img
        src="https://www.afbostader.se/globalassets/bostadsomraden/pireus/pf_bsflb.jpg"
        alt="Högtidsdräktsexempel"
      />
      <h6>{@html m.nolla_packing_frack()}</h6>
      <p>{@html m.nolla_packing_frack_description()}</p>
    </li>
  </ul>
</section>
