<script lang="ts">
	import { twMerge } from "tailwind-merge";

	export let date: Date;

	let internal: string = date
		.toLocaleString("sv")
		.split(" ")
		.join("T")
		.slice(0, 16);

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

	$: input(date);
	$: output(internal);
</script>

<input
	type="datetime-local"
	bind:value={internal}
	{...$$props}
	class={twMerge("input input-bordered", $$props["class"] ?? "")}
/>
