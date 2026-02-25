<script lang="ts">
	import { useQRScanner } from "$lib/hooks/useQRScanner";
	import * as m from "$paraglide/messages";

	interface Props {
		onScan: (text: string) => void;
	}

	let { onScan }: Props = $props();

	let videoElement: HTMLVideoElement | undefined = $state();
	let errorMessage = $state("");

	const { initialize } = useQRScanner();

	$effect(() => {
		if (videoElement) {
			initialize(videoElement, (text) => {
				onScan(text);
			}).then((result) => {
				if (result.error) {
					errorMessage = result.error;
				}
			});
		}
	});
</script>

<div class="flex w-100 justify-center p-4">
	<div class="max-w-500px w-100">
		{#if errorMessage}
			<p class="p-4 text-center text-red-500">
				{m.events_camera_init_failure()}<br />
				Error: {errorMessage}
			</p>
		{:else}
			<video bind:this={videoElement} class="w-100" playsinline>
				<track kind="captions" src="" label="English captions" srclang="en" />
			</video>
		{/if}
	</div>
</div>
