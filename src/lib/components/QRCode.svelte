<script lang="ts">
	export let data: string;

	$: qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&format=svg&color=fff&bgcolor=f280a1&data=${encodeURIComponent(data)}`;
</script>

<div class="aspect-square max-w-80 self-center rounded-xl bg-[#f280a1] p-8">
	<img alt="QR code for ticket" src={qrCodeUrl} />
</div>
