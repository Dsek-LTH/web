<script lang="ts">
  import * as m from "$paraglide/messages";
</script>

<div class="my-16 space-y-32">
  <header class="flex justify-between">
    <h1 class="font-nolla-mono text-8xl font-bold">{m.nolla_todo_header()}</h1>
  </header>

  <section
    class="grid grid-cols-2 overflow-hidden rounded-box bg-secondary shadow-xl"
  >
    <img
      src="https://www.afbostader.se/globalassets/bostadsomraden/pireus/pf_bsflb.jpg"
      alt=""
      class="h-full object-cover"
    />
    <div class="p-16">
      <h1 class="text-xl font-bold">{m.nolla_todo_boende()}</h1>
      <p>
        {m.nolla_todo_boendeText()}
      </p>
      <a href="/nolla/boende" class="link">{m.nolla_todo_readMore()}</a>
      <ul class="mt-8 flex gap-4">
        <li>
          <a href="https://www.afbostader.se/" class="link" target="_blank">
            AF Bostäder
            <span class="i-mdi-external-link" />
          </a>
        </li>
        <li>
          <a
            href="https://www.facebook.com/groups/458545794323070"
            class="link"
            target="_blank"
          >
            Boende i Lund
            <span class="i-mdi-external-link" />
          </a>
        </li>
        <li>
          <a href="https://www.mhklund.se/" class="link" target="_blank">
            MHK
            <span class="i-mdi-external-link" />
          </a>
        </li>
        <li>
          <a href="https://www.lkf.se/" class="link" target="_blank">
            LKF
            <span class="i-mdi-external-link" />
          </a>
        </li>
      </ul>
    </div>
  </section>

  <section
    class="grid grid-cols-2 overflow-hidden rounded-box bg-primary shadow-xl"
  >
    <div class="p-16">
      <h1 class="text-xl font-bold">{m.nolla_todo_nationer()}</h1>
      <p>
        {m.nolla_todo_nationerText()}
      </p>
      <a href="https://www.studentlund.se/" class="link"
        >{m.nolla_todo_readMore()}</a
      >
    </div>

    <img
      src="https://static-cdn.sr.se/images/2054/4ee08adc-68ca-45f7-bee9-579b09817ab0.jpg?preset=1024x576"
      alt=""
      class="h-full object-cover"
    />
  </section>

  <section
    class="grid grid-cols-2 overflow-hidden rounded-box bg-secondary shadow-xl"
  >
    <img
      src="https://media.cnn.com/api/v1/images/stellar/prod/underscored-how-to-pack-a-suitcase-lead-packing.jpg?q=h_1800,w_3200,x_0,y_0"
      alt=""
      class="h-full object-cover"
    />

    <div class="p-16">
      <h1 class="text-xl font-bold">{m.nolla_todo_list()}</h1>
      <p>
        {m.nolla_todo_listText()}
      </p>
      <a href="/nolla/packing" class="link">{m.nolla_todo_readMore()}</a>
    </div>
  </section>
</div>
