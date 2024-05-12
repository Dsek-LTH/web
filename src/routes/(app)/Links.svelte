<script lang="ts">
  import * as m from "$paraglide/messages";
  const links = [
    {
      title: m.home_feedback(),
      description: m.home_contactWellbeing(),
      path: "https://bit.ly/kontaktatrivsel",
      icon: "i-mdi-speak",
    },
    {
      title: "Nollningen",
      description: "Info om nollningen",
      path: "/",
      icon: "i-mdi-information-outline",
    },
    {
      title: "Engagera dig",
      description: "Hur blir jag aktiv på D-sektionen",
      path: "/committees",
      icon: "i-mdi-account-multiple",
    },
    {
      title: "Dokument",
      description: "Kolla in senaste styrdokumenten",
      path: "/documents/governing",
      icon: "i-mdi-gavel",
    },
    {
      title: "Webshop",
      description: "Köp biljetter",
      path: "/shop/tickets",
      icon: "i-mdi-store",
    },
    {
      title: "Styrelsen",
      description: "Mer om styrelsen",
      path: "/board",
      icon: "i-mdi-account-tie",
    },
  ];
</script>

<div class="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
  {#each links as link}
    <a
      class="flex gap-6 rounded-md bg-base-300 p-6 transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:bg-base-200 hover:shadow-xl"
      href={link.path}
    >
      <span class={`${link.icon} self-center text-4xl`} />
      <div>
        <h2 class="text-xl font-bold">{link.title}</h2>
        <p>{link.description}</p>
      </div>
    </a>
  {/each}
</div>
