<script lang="ts" context="module">
	type T = Record<string, unknown>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
	import Input from "$lib/components/Input.svelte";

	import {
		formFieldProxy,
		type FormFieldProxy,
		type FormPathLeaves,
		type SuperForm,
	} from "sveltekit-superforms";

	export let superform: SuperForm<T>;
	export let field: FormPathLeaves<T>;
	// as long as field is not nested, or data type is 'json', name does not need to be set
	export let name: string | undefined = undefined;
	export let label: string | null = null;
	let clazz: string | undefined = undefined;
	export { clazz as class };

	$: fieldProxy = formFieldProxy(
		superform,
		field,
	) satisfies FormFieldProxy<number>;
	$: errors = fieldProxy.errors;
	$: constraints = fieldProxy.constraints;
	$: value = fieldProxy.value;

	let oldValue: number | undefined = undefined;
	$: {
		if (
			!/^[-+]{0,1}\d*([.,]\d{0,2})?$/.test($value.toString()) &&
			$value.toString() !== ""
		) {
			value.set(oldValue ?? 0);
		}
		oldValue = $value;
	}
</script>

<Input
	name={name ?? field}
	type="text"
	inputmode="decimal"
	{label}
	class={clazz}
	bind:value={$value}
	onfocusout={() => {
		value.set(parseFloat($value.toString().replace(",", ".")));
	}}
	error={$errors}
	{...$constraints}
	{...$$restProps}
/>
