<script lang="ts">
	import { page } from "$app/stores";
	import NotificationModal from "$lib/components/NotificationModal.svelte";
	import type { NotificationGroup } from "$lib/utils/notifications/group";
	import type { NotificationSchema } from "$lib/zod/schemas";
	import type { SuperValidated } from "sveltekit-superforms";
	import { twMerge } from "tailwind-merge";
	import NotificationBellContent from "./NotificationBellContent.svelte";

	export let notificationsPromise: Promise<NotificationGroup[]>;
	export let form: SuperValidated<NotificationSchema>;
	export let useModalInstead = false;
	export let externalModal: HTMLDialogElement | undefined = undefined;
	export let buttonClass: string | undefined = undefined;
	export let postReveal = false;

	export let notifications: NotificationGroup[] | undefined = undefined;
	$: (() => {
		notificationsPromise.then((loadedNotifications) => {
			notifications = loadedNotifications;
		});
	})();

	let internalModal: HTMLDialogElement;

	// Get the number of unread notifications, which is then used to indicate the user

	// this is a somewhat ugly way to keep focus on the bell button after a notification is removed
	// if this is not here, whenever an action is taken (such as removing a notification), the form will cause the elements to lose focus and the menu will close
	let bellButton: HTMLButtonElement;
	const onDeleted = () => {
		bellButton.focus();
	};
	$: (() => {
		if ($page.form?.form?.data?.notificationId !== undefined) {
			// a notification was removed
			setTimeout(() => {
				// needs to be done next update cycle, otherwise it doesn' work. In practice, is still instant
				onDeleted();
			});
		}
	})();
	export let onRead = (id: number | "all") => {
		if (id === "all") {
			notifications = notifications?.map((notification) => ({
				...notification,
				readAt: new Date(),
			}));
		} else {
			notifications = notifications?.map((notification) =>
				notification.id === id
					? {
							...notification,
							readAt: new Date(),
						}
					: notification,
			);
		}
	};
</script>

<div class="dropdown">
	<!-- When user clicks on the bell icon, it will update all notifications as read -->
	<button
		bind:this={bellButton}
		type="button"
		on:click={externalModal || useModalInstead
			? () => (externalModal ?? internalModal).showModal()
			: undefined}
		tabindex="0"
		class={twMerge("btn btn-ghost *:text-xl", buttonClass)}
		data-dropdown-toggle="dropdown"
	>
		{#if notifications !== undefined}
			{@const unreadCount = notifications.filter(
				(data) => data.readAt == null,
			).length}
			<slot {unreadCount}>
				{#if unreadCount <= 0}
					<span class="i-mdi-bell-outline"></span>
				{/if}
				{#if unreadCount > 0}
					<span class="i-mdi-bell-ring-outline animate-bounce"></span>
					<span
						class="rounded-box absolute top-0 right-0 flex h-6 w-6 items-center justify-center bg-red-600 text-center !text-sm"
						>{unreadCount}</span
					>
				{/if}
			</slot>
		{:else}
			{#await notificationsPromise}
				<slot name="loading">
					<span class="i-mdi-bell-outline mx-auto"></span>
				</slot>
			{/await}
		{/if}
	</button>

	{#if !externalModal && useModalInstead}
		<NotificationModal
			{form}
			{postReveal}
			bind:modal={internalModal}
			{onRead}
			bind:notifications
		/>
	{:else if !externalModal}
		<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
		<ul
			tabindex="0"
			class="menu dropdown-content rounded-box bg-base-100 !fixed right-0 z-[1] max-h-[80svh] w-full flex-nowrap overflow-clip p-0 shadow sm:!absolute sm:w-[27rem]"
		>
			{#if notifications !== undefined}
				<NotificationBellContent
					{notifications}
					{postReveal}
					{onDeleted}
					{form}
					{onRead}
				/>
			{:else}
				{#await notificationsPromise}
					<span class="loading loading-lg"></span>
				{/await}
			{/if}
		</ul>
	{/if}
</div>
