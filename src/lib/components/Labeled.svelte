<script lang="ts" module>
	export interface LabeledAttributes {
		class?: ClassNameValue;
		label?: string | null;
		explanation?: string | null;
		error?: string | string[] | string[][] | undefined;
		fullWidth?: boolean;
		invisibleText?: boolean;
		required?: boolean | undefined | null;
	}
</script>

<script lang="ts">
	import type { Snippet } from "svelte";
	import { twMerge, type ClassNameValue } from "tailwind-merge";

	let {
		children = undefined,
		class: clazz = "",
		label = null,
		explanation = null,
		error = undefined,
		fullWidth = false,
		invisibleText = false,
		required = false,
		for: _for = undefined,
	}: {
		children?: Snippet<[]>;
		class?: string;
		for?: string;
	} & LabeledAttributes = $props();

	$effect(() => {
		console.log(error);
	});
</script>

<label
	class={twMerge(
		"form-control relative",
		fullWidth ? "w-full md:w-auto " : "",
		clazz,
	)}
	for={_for}
>
	{#if label}
		<div class="label">
			<span class="label-text" class:invisible={invisibleText}>
				{label}{#if required}
					<span class="font-bold">*</span>
				{/if}
				{#if explanation}
					<span
						class="badge badge-neutral tooltip aspect-square px-1"
						data-tip={explanation}
					>
						?
					</span>
				{/if}
			</span>
		</div>
	{/if}
	{@render children?.()}
	{#if error !== undefined}
		<div class="label">
			<span
				class="form-error label-text-alt text-error"
				class:invisible={invisibleText}
			>
				{#if typeof error === "string"}{error}{:else if Array.isArray(error) && error.length > 0 && Array.isArray(error[0])}{error
						.map((e) => (Array.isArray(e) ? e.join(", ") : e))
						.join(", ")}{:else if Array.isArray(error)}{error.join(
						", ",
					)}{:else}{error}{/if}
			</span>
		</div>
	{/if}
</label>
