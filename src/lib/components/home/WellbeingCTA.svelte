<script lang="ts">
  import * as m from "$paraglide/messages";

  let { wellbeing }: { wellbeing: string } = $props();
</script>

<a
  class="pop-out flex gap-6 rounded-2xl bg-base-300 px-6 py-3"
  href="https://bit.ly/trivselkontakt"
  target="_blank"
  rel="noreferrer noopener"
>
  <span class="i-mdi-speak self-center text-2xl text-secondary lg:text-primary"
  ></span>

  <article>
    <p>{wellbeing}</p>
    <h2 class="text-xl font-bold text-secondary lg:text-primary">
      {m.home_contactWellbeing()}
    </h2>
  </article>
</a>
