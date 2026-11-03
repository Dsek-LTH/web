import type { ToastNotification } from "$lib/stores/toast";
import type { Theme } from "$lib/utils/themes";
import type { AvailableLanguageTag } from "$paraglide/runtime";
import type { AuthUser, SignedInMember } from "$lib/auth/types";

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  type MessageType = ToastNotification["type"];
  type Message = {
    type: MessageType;
    message: string;
    id?: string;
  };
  namespace App {
    type AppInfo = {
      os?: string;
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
      member?: SignedInMember;
      isApp: boolean;
      appInfo?: AppInfo;
      theme: Theme;
      language: AvailableLanguageTag;
    }
    interface PageData {
      user?: AuthUser;
      member?: SignedInMember;
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
