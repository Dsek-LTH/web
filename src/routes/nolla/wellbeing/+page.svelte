<script lang="ts">
  import wellbeingImage from "./trivsel.webp";
  import * as m from "$paraglide/messages";
</script>

<!-- eslint-disable svelte/no-at-html-tags -->
<header>
  <h1 class="nolla-page-title">
    {@html m.nolla_wellbeing_header()}
  </h1>
</header>

<article class="md:grid md:grid-cols-2">
  <p class="col-start-1 row-start-1 mb-16">
    {@html m.nolla_wellbeing_description()}
  </p>

  <img
    src={wellbeingImage}
    alt="Trivselrådet"
    class="row-span-2 md:col-start-2"
  />

  <p class="col-start-1">
    {@html m.nolla_wellbeing_trivsel_description()}
  </p>

  <a
    class="neo-brutal-btn col-start-1 mb-16 w-min whitespace-nowrap"
    href="https://bit.ly/kontaktatrivsel"
    >{m.nolla_wellbeing_contact_trivsel()}</a
  >

  <p class="col-start-1">
    {@html m.nolla_wellbeing_student_health()}
  </p>

  <a
    class="neo-brutal-btn col-start-1 w-min whitespace-nowrap"
    href="https://www.student.lth.se/stoed-och-service/maa-bra-under-dina-studier/"
  >
    {m.nolla_wellbeing_contact_student_health()}
  </a>
</article>
