// See https://kit.svelte.dev/docs/types#app

import type { ToastNotification } from "$lib/stores/toast";
import type { Member } from "@prisma/client";

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
    // interface Locals {}
    interface PageData {
      accessPolicies: string[];
      currentMember: Member | null;
      flash?: Message;
    }
    // interface Platform {}

    namespace Superforms {
      type Message = Message;
    }
  }
}

export {};
