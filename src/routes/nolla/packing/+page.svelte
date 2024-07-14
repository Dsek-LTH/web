<script lang="ts">
  import * as m from "$paraglide/messages";
</script>

<header class="mx-auto max-w-prose">
  <h1 class="font-nolla-mono text-8xl font-bold">{m.nolla_packing_header()}</h1>
</header>

<article class="mx-auto my-16 max-w-prose">
  <p>
    {m.nolla_packing_description()}
  </p>
  <ul
    class="flex list-disc flex-col gap-4 [&>li>b]:inline-block [&>li>b]:font-semibold [&>li>p]:mt-0 [&>li>p]:text-sm [&>li>p]:italic"
  >
    <li>
      <b>{m.nolla_packing_robust_clothing()}</b>
      <p>
        {m.nolla_packing_robust_clothing_description()}
      </p>
    </li>
    <li>
      <b>{m.nolla_packing_theme_outfits()}</b>
      <p>
        {m.nolla_packing_theme_outfits_description()}
      </p>
    </li>
    <li>
      <b>{m.nolla_packing_fancy_clothing()}</b>
      <p>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html m.nolla_packing_fancy_clothing_description()}
      </p>
    </li>
    <li>
      <b>{m.nolla_packing_happy_mood()}</b>
    </li>
  </ul>
</article>

<section id="kladkod" class="my-16">
  <ul
    class="neo-brutal-box grid grid-cols-1 gap-2 bg-primary md:grid-cols-2 xl:grid-cols-4 [&>li>h6]:text-lg [&>li>h6]:font-semibold [&>li>img]:object-contain [&>li>p>i]:text-sm [&>li>p>i]:opacity-80"
  >
    <li>
      <img src="#" alt="Slasque-exempel" />
      <h6>{m.nolla_packing_slasque()}</h6>
      <p>
        {m.nolla_packing_slasque_description()}
      </p>
    </li>
    <li>
      <img src="#" alt="Bruten kavaj exempel" />
      <h6>{m.nolla_packing_mixed_suit()}</h6>
      <p>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html m.nolla_packing_mixed_suit_description()}
      </p>
    </li>
    <li>
      <img src="#" alt="Mörk kostym exempel" />
      <h6>{m.nolla_packing_dark_suit()}</h6>
      <p>
        {m.nolla_packing_dark_suit_description()}
      </p>
    </li>
    <li>
      <img src="#" alt="Högtidsdräktsexempel" />
      <h6>{m.nolla_packing_frack()}</h6>
      <p>{m.nolla_packing_frack_description()}</p>
    </li>
  </ul>
</section>
