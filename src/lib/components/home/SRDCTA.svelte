<script lang="ts">
  import * as m from "$paraglide/messages";
</script>

<a
  class="pop-out flex gap-6 rounded-2xl bg-base-300 px-6 py-3"
  href="https://link.dsek.se/srd"
  target="_blank"
  rel="noreferrer noopener"
>
  <span class="i-mdi-pencil self-center text-2xl text-secondary lg:text-primary"
  ></span>

  <article>
    <p>{m.home_feedbackSRD()}</p>
    <h2 class="text-xl font-bold text-secondary lg:text-primary">
      {m.home_contactSRD()}
    </h2>
  </article>
</a>
