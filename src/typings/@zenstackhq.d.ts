import "@zenstackhq/runtime";

declare module "@zenstackhq/runtime" {
  export interface AuthUser {
    studentId: string;
    memberId: string;
    policies: string[];
  }
}
