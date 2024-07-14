<script lang="ts">
  import * as m from "$paraglide/messages";
</script>

<!-- eslint-disable svelte/no-at-html-tags -->
<header>
  <h1 class="text-left font-nolla-mono text-8xl font-bold">
    {@html m.nolla_wellbeing_header()}
  </h1>
</header>

<article class="grid grid-cols-2 py-16">
  <p class="col-start-1 mb-16">
    {@html m.nolla_wellbeing_description()}
  </p>

  <img src="#" alt="Trivselrådet" class="col-start-2" />

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
