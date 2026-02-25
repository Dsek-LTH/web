<script lang="ts">
	import Notification from "$lib/components/Notification.svelte";
	import PostRevealNotification from "$lib/components/postReveal/PostRevealNotification.svelte";
	import { superForm } from "$lib/utils/client/superForms";
	import type { NotificationGroup } from "$lib/utils/notifications/group";
	import type { NotificationSchema } from "$lib/zod/schemas";
	import * as m from "$paraglide/messages";
	import type { SuperValidated } from "sveltekit-superforms";

	export let form: SuperValidated<NotificationSchema>;
	export let modal: HTMLDialogElement;
	export let notifications: NotificationGroup[] | undefined = undefined;
	export let allowDelete = true;
	export let postReveal = false;
	export let onRead = (id: number | "all") => {
		console.log("onRead");
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
		notifications = notifications;
		console.log(notifications?.filter((n) => !n.readAt).length);
	};

	const { enhance: readEnhance } = superForm(form, {
		id: "readNotifications",
		onSubmit: () => {
			onRead("all");
		},
	});
</script>

<dialog id="notificationModal" class="modal" bind:this={modal}>
	<div
		class="modal-box relative flex h-[calc(100dvh-8rem)] w-[calc(100dvw-2rem)] flex-col flex-nowrap"
	>
		{#if notifications !== undefined}
			<ul class="-mx-6 flex-nowrap overflow-y-auto">
				{#if notifications.length > 0}
					{#each notifications as notification (notification.id)}
						<li>
							{#if postReveal}
								<PostRevealNotification
									onClick={() => modal.close()}
									{allowDelete}
									{notification}
									onRead={() => onRead(notification.id)}
								/>
							{:else}
								<Notification
									onClick={() => modal.close()}
									{allowDelete}
									{notification}
									onRead={() => onRead(notification.id)}
								/>
							{/if}
						</li>
					{/each}
				{:else}
					<li class="p-4">{m.navbar_bell_noNotifications()}</li>
				{/if}
			</ul>
		{:else}
			<span class="loading loading-lg mx-auto self-center"></span>
		{/if}
		<form method="dialog">
			<button
				class="btn btn-circle btn-ghost btn-sm bg-base-100 absolute top-2 right-2 z-10"
				>✕</button
			>
		</form>
		<!-- Read all notifications (notifications are read on visit otherwise) -->
		{#if notifications && notifications?.filter((n) => n.readAt === null)?.length > 0}
			<form
				method="POST"
				action="/notifications?/readNotifications"
				use:readEnhance
				data-sveltekit-keepfocus
			>
				{#each notifications as notification (notification.id)}
					{#if notification.readAt === null}
						{#each notification.individualIds as id}
							<input type="hidden" name="notificationIds" value={id} />
						{/each}
					{/if}
				{/each}
				<button
					class="btn btn-ghost no-animation z-10 w-full rounded-none border-0 border-t border-gray-700 *:text-2xl"
				>
					{m.navbar_bell_markAllAsRead()}
					<span class="i-mdi-bell-check-outline"></span>
				</button>
			</form>
		{/if}
		<!-- Deletes all notifications -->
		{#if notifications && notifications?.flatMap((n) => n.individualIds).length > 0}
			<form
				method="POST"
				action="/notifications?/deleteNotification"
				data-sveltekit-keepfocus
			>
				{#each notifications as notification (notification.id)}
					{#each notification.individualIds as id}
						<input type="hidden" name="notificationIds" value={id} />
					{/each}
				{/each}
				<button
					class="btn btn-ghost no-animation z-10 w-full rounded-none border-0 border-t border-gray-700 *:text-2xl"
				>
					{m.navbar_bell_deleteAll()}
					<span class="i-mdi-delete-outline"></span>
				</button>
			</form>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
