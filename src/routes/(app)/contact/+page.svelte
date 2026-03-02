<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar";
  import { getInitials } from "$lib/utils/client/member";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let { vordf, ordf, nara } = $derived(data);
</script>

<div class="layout-container">
  <h1>Kontakt</h1>
  <p>
    D-sektionen består av 15 utskott, där varje utskott leds av en mästare som
    oftast sitter med i styrelsen. Alla utskott har varsitt ansvarsområde. osv.
  </p>
  <div class="flex flex-col">
    <div class="flex flex-row justify-around gap-4">
      {@render positionCard(
        vordf,
        "För generella frågor, kontakta Vice Ordförande.",
      )}
      {@render positionCard(
        ordf,
        "För generella frågor, kontakta Vice Ordförande.",
      )}
      {@render positionCard(
        nara,
        "För generella frågor, kontakta Vice Ordförande.",
      )}
    </div>
  </div>
</div>
{#snippet positionCard(position, description)}
  <div class="flex w-64 flex-col rounded-md border-[1px] p-4">
    <Avatar.Root class="border-background size-40 self-center border-4">
      <Avatar.Image
        src={position?.member?.picturePath ?? ""}
        alt="Member image"
      />
      <Avatar.Fallback class="text-xl"
        >{getInitials(position?.member)}</Avatar.Fallback
      >
    </Avatar.Root>
    <h3>{position?.position.name}</h3>
    <h6>{position?.member?.firstName} {position?.member?.lastName}</h6>
    <span>{description}</span>
    <a class="link break-words" href="mailto:vordforande@dsek.se"
      >{position?.position.email}</a
    >
  </div>
{/snippet}
