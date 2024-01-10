import { dev } from "$app/environment";
import KcAdminClient from "@keycloak/keycloak-admin-client";
import {
  KEYCLOAK_ADMIN_USERNAME,
  KEYCLOAK_ADMIN_PASSWORD,
  KEYCLOAK_ENDPOINT,
} from "$env/static/private";

async function auth() {
  if (dev) return;

  const kcAdminClient = new KcAdminClient({
    baseUrl: KEYCLOAK_ENDPOINT || "",
    realmName: "master",
  });

  await kcAdminClient.auth({
    username: KEYCLOAK_ADMIN_USERNAME || "",
    password: KEYCLOAK_ADMIN_PASSWORD || "",
    grantType: "password",
    clientId: "admin-cli",
  });

  kcAdminClient.setConfig({ realmName: "dsek" });

  return kcAdminClient;
}

async function addMandate(memberId: string, positionId: string) {
  const client = await auth();

  await client!.users.addToGroup({
    id: memberId,
    groupId: positionId,
  });
}

async function deleteMandate(memberId: string, positionId: string) {
  const client = await auth();

  await client!.users.delFromGroup({
    id: memberId,
    groupId: positionId,
  });
}

export default {
  addMandate,
  deleteMandate,
};
