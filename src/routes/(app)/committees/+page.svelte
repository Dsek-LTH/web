<script lang="ts">
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import DOMPurify from "isomorphic-dompurify";

  let { data } = $props();

  const breakName = (name: string) => {
    let output = "";
    if (name.includes("utskottet"))
      output = `${name.split("utskottet")[0]}&shy;utskottet`;
    else if (name.includes("kommittén"))
      output = `${name.split("kommittén")[0]}&shy;kommittén`;
    else if (name.includes("mästeriet"))
      output = `${name.split("mästeriet")[0]}&shy;mästeriet`;
    else output = name;
    return DOMPurify.sanitize(output);
  };
</script>

<div class="layout-container">
  <h1>Utskott</h1>
  <p></p>

  <div
    class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
  >
    {#each data.committees
      .filter((e) => e.shortName != "dchip") //remove before merge?
      .sort( (e1, e2) => e1.name.localeCompare(e2.name), ) as committee (committee.id)}
      <a class="block" href="/committees/{committee.shortName}">
        <div
          class="border-border flex h-full w-full flex-grow flex-col rounded-md border-[1px]"
        >
          <div
            class="bg-rosa-300 relative aspect-square max-h-64 max-w-64 rounded-t-md bg-cover bg-center"
            style="background-image: url('{committee.previewUrl}')"
          >
            <CommitteeIcon
              override={committee.isBannerTextLight ? "light" : "dark"}
              {committee}
              class="absolute top-2 left-2 size-16"
            />
          </div>
          <div class="flex flex-col gap-1 p-3">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized before output -->
            <h3>{@html breakName(committee.name)}</h3>
            <span>{committee.description}</span>
          </div>
        </div>
      </a>
    {/each}
  </div>

  <a class="mt-12 block" href="https://dchip.se">
    <div class="border-border flex h-32 flex-row rounded-md border-[1px]">
      <div class="relative flex w-1/2 flex-col gap-1 p-4">
        <h3>D-chip</h3>
        <span>
          D-Chip är en ideell, studentdriven förening som studenterna på
          Datateknik och InfoCom på LTH hör till. Alla kvinnliga och icke-binära
          studenter på de två programmen kan vara med i D-Chip.
        </span>
      </div>
      <div
        class="before:to-[rgba(0, 0, 0, 1)] before:from-accent bg-rosa-300 relative w-1/2 rounded-r-md bg-cover bg-center before:absolute before:left-0 before:mr-0 before:h-full before:w-60 before:bg-linear-to-r"
        style="background-image: url('https://files.dsek.se/files/public/photos/dchip.jpg')"
      >
        <img
          src="https://www.dchip.se/images/rosa_panter.png"
          alt="dchip"
          class="absolute top-4 right-4 h-24"
        />
      </div>
    </div>
  </a>
</div>
