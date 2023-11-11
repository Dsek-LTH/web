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
      currentMember: Member | undefined;
    }
    // interface Platform {}
  }
}

export {};
