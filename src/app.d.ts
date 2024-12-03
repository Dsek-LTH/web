import type { ToastNotification } from "$lib/stores/toast";
import type { Theme } from "$lib/utils/themes";
import type { Member, PrismaClient } from "@prisma/client";
import type { AuthUser } from "@zenstackhq/runtime";

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
      member?: Member;
      prisma: PrismaClient;
      isApp: boolean;
      appInfo?: AppInfo;
      theme: Theme;
    }
    interface PageData {
      user?: AuthUser;
      member?: Member;
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
