import type { ToastNotification } from "$lib/stores/toast";
import type { Theme } from "$lib/utils/themes";
import type { AvailableLanguageTag } from "$paraglide/runtime";
import type { AuthUser } from "@zenstackhq/runtime";
import type {
	ExtendedPrisma,
	ExtendedPrismaModel,
} from "$lib/server/extendedPrisma";

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	type MessageType = ToastNotification["type"] | "hidden";
	type Message = {
		type: MessageType;
		message: string;
		id?: string;
	};
	namespace App {
		type AppInfo = {
			insets: {
				top: number;
				bottom: number;
				left: number;
				right: number;
			};
		};
		interface Error {
			message: string;
			statusDescription?: string;
		}
		interface Locals {
			user: AuthUser;
			member?: ExtendedPrismaModel<"Member">;
			prisma: ExtendedPrisma;
			isApp: boolean;
			appInfo?: AppInfo;
			theme: Theme;
			language: AvailableLanguageTag;
		}
		interface PageData {
			user?: AuthUser;
			member?: ExtendedPrismaModel<"Member">;
			flash?: Message;
			isApp: boolean;
			appInfo?: AppInfo;
			theme: Theme;
		}
		// interface Platform {}

		namespace Superforms {
			type Message = Message;
		}
	}

	interface Window {
		notificationToken?: string;
		unreadNotificationCount?: number;
	}
}

export {};
