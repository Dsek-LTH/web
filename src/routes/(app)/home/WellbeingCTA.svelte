<script lang="ts">
  import * as m from "$paraglide/messages";
</script>

<a
  class="pop-out flex gap-6 rounded-2xl bg-base-300 p-6"
  href="https://bit.ly/kontaktatrivsel"
>
  <span
    class="i-mdi-speak self-center text-2xl text-secondary lg:text-primary"
  />

  <article>
    <p>{m.landing_feedback()}</p>
    <h2 class="text-xl font-bold text-secondary lg:text-primary">
      {m.landing_contactWellbeing()}
    </h2>
  </article>
</a>
