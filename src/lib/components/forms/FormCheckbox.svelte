<script lang="ts" context="module">
	type T = Record<string, unknown>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
	import Labeled from "$lib/components/Labeled.svelte";

	import {
		formFieldProxy,
		type FormFieldProxy,
		type FormPathLeaves,
		type SuperForm,
	} from "sveltekit-superforms";
	import { twMerge, type ClassNameValue } from "tailwind-merge";

	export let superform: SuperForm<T>;
	export let field: FormPathLeaves<T>;
	// as long as field is not nested, or data type is 'json', name does not need to be set
	export let name: string | undefined = undefined;
	export let label: string | null = null;
	let clazz: ClassNameValue = undefined;
	export { clazz as class };

	$: fieldProxy = formFieldProxy(
		superform,
		field,
	) satisfies FormFieldProxy<boolean>;
	$: value = fieldProxy.value;
	$: errors = fieldProxy.errors;
</script>

<Labeled {label} error={$errors} {...$$restProps}>
	<input
		name={name ?? field}
		type="checkbox"
		class={twMerge("checkbox ml-2", clazz)}
		bind:checked={$value}
		{...$$restProps}
	/>
</Labeled>
