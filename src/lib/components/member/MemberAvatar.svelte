<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { getInitials } from "$lib/utils/client/member";

  let {
    member,
    class: klass,
    lazy,
  }: {
    member: Pick<
      ExtendedPrismaModel<"Member">,
      "picturePath" | "firstName" | "lastName"
    >;
    class?: string;
    lazy?: boolean;
  } = $props();
</script>

<Avatar.Root class={klass}>
  <Avatar.Image {lazy} src={member?.picturePath} alt="Member image" />
  <Avatar.Fallback class="text-xs">{getInitials(member)}</Avatar.Fallback>
</Avatar.Root>
