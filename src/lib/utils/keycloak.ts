import KcAdminClient from "@keycloak/keycloak-admin-client";
import {
  KEYCLOAK_ADMIN_USERNAME,
  KEYCLOAK_ADMIN_PASSWORD,
  KEYCLOAK_ENDPOINT,
  KEYCLOAK_ENABLED,
} from "$env/static/private";

const enabled = KEYCLOAK_ENABLED === "true";

async function auth() {
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
  if (!enabled) return;
  const client = await auth();

  await client!.users.addToGroup({
    id: memberId,
    groupId: positionId,
  });
}

async function deleteMandate(memberId: string, positionId: string) {
  if (!enabled) return;
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
