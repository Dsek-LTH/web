// See https://kit.svelte.dev/docs/types#app

import type { Member } from "@prisma/client";

// for information about these interfaces
declare global {
  namespace App {
    interface Error {
      message: string;
      statusDescription?: string;
    }
    // interface Locals {}
    interface PageData {
      accessPolicies: string[];
      currentMember: Member | null;
    }
    // interface Platform {}

    namespace Superforms {
      type Message = {
        type: "error" | "success" | "hidden";
        message: string;
      };
    }
  }
}

export {};
