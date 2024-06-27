// See https://kit.svelte.dev/docs/types#app

import type { ToastNotification } from "$lib/stores/toast";
import type { Member, PrismaClient } from "@prisma/client";
import type { AuthUser } from "@zenstackhq/runtime";

// for information about these interfaces
declare global {
  type MessageType = ToastNotification["type"] | "hidden";
  type Message = {
    type: MessageType;
    message: string;
  };
  namespace App {
    interface Error {
      message: string;
      statusDescription?: string;
    }
    interface Locals {
      user: AuthUser;
      member?: Member;
      prisma: PrismaClient;
      isApp: boolean;
      appInfo?: {
        insets: {
          top: number;
          bottom: number;
          left: number;
          right: number;
        };
      };
    }
    interface PageData {
      user?: AuthUser;
      member?: Member;
      flash?: Message;
    }
    // interface Platform {}

    namespace Superforms {
      type Message = Message;
    }
  }
}

export {};
