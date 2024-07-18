<script lang="ts">
  import slasque from "./slasque.webp";
  import mixed from "./mixed.webp";
  import suit from "./suit.webp";
  import frack from "./frack.webp";
  import * as m from "$paraglide/messages";
</script>

<!-- eslint-disable svelte/no-at-html-tags -->
<header class=" max-w-prose">
  <h1 class="nolla-page-title">
    {@html m.nolla_packing_header()}
  </h1>
</header>

<article class=" max-w-prose">
  <p class="nolla-prose">
    {@html m.nolla_packing_description()}
  </p>
  <ul
    class="ml-4 flex list-outside list-disc flex-col gap-4 [&>li>b]:inline-block [&>li>b]:font-semibold [&>li>p]:mt-0 [&>li>p]:text-sm [&>li>p]:italic"
  >
    <li>
      <b>{@html m.nolla_packing_robust_clothing()}</b>
      <p class="nolla-prose">
        {@html m.nolla_packing_robust_clothing_description()}
      </p>
    </li>
    <li>
      <b>{@html m.nolla_packing_theme_outfits()}</b>
      <p class="nolla-prose">
        {@html m.nolla_packing_theme_outfits_description()}
      </p>
    </li>
    <li>
      <b>{@html m.nolla_packing_fancy_clothing()}</b>
      <p class="nolla-prose">
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
    class="[&>li>img]:neo-brutal-border grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4 [&>li>h6]:text-lg [&>li>h6]:font-semibold [&>li>img]:mb-2 [&>li>img]:!border-8 [&>li>img]:object-contain [&>li>p>i]:text-sm [&>li>p>i]:opacity-80 [&>li>p]:mt-2"
  >
    <li>
      <img
        class="!border-primary"
        width={1512}
        height={2016}
        src={slasque}
        alt="Slasque-exempel"
      />
      <h6>{@html m.nolla_packing_slasque()}</h6>
      <p class="nolla-prose">
        {@html m.nolla_packing_slasque_description()}
      </p>
    </li>
    <li>
      <img
        class="!border-secondary"
        width={1512}
        height={2016}
        src={mixed}
        alt="Bruten kavaj exempel"
      />
      <h6>{@html m.nolla_packing_mixed_suit()}</h6>
      <p class="nolla-prose">
        {@html m.nolla_packing_mixed_suit_description()}
      </p>
    </li>
    <li>
      <img
        class="!border-primary"
        width={1512}
        height={2016}
        src={suit}
        alt="Mörk kostym exempel"
      />
      <h6>{@html m.nolla_packing_dark_suit()}</h6>
      <p class="nolla-prose">
        {@html m.nolla_packing_dark_suit_description()}
      </p>
    </li>
    <li>
      <img
        class="!border-secondary"
        width={1512}
        height={2016}
        src={frack}
        alt="Högtidsdräktsexempel"
      />
      <h6>{@html m.nolla_packing_frack()}</h6>
      <p class="nolla-prose">{@html m.nolla_packing_frack_description()}</p>
    </li>
  </ul>
</section>
