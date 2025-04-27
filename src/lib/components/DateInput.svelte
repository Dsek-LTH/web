<script lang="ts">
  import { twMerge } from "tailwind-merge";

  interface Props {
    date: Date;
    class?: string;
  }

  let { date = $bindable(), class: klass, ...rest }: Props = $props();

  let internal: string = $state(
    date.toLocaleString("sv").split(" ").join("T").slice(0, 16),
  );

  const input = (x: Date) => {
    const newDateString = x
      .toLocaleString("sv")
      .split(" ")
      .join("T")
      .slice(0, 16);
    if (internal === newDateString) return;
    internal = newDateString;
  };
  const output = (x: string) => {
    const newDate = new Date(x);
    if (date.getTime() === newDate.getTime()) return;
    date = new Date(x);
  };

  $effect(() => {
    input(date);
  });
  $effect(() => {
    output(internal);
  });
</script>

<input
  type="datetime-local"
  bind:value={internal}
  {...rest}
  class={twMerge("input input-bordered", klass ?? "")}
/>
