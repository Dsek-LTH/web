import KcAdminClient from "@keycloak/keycloak-admin-client";
import {
  KEYCLOAK_ADMIN_USERNAME,
  KEYCLOAK_ADMIN_PASSWORD,
  KEYCLOAK_ENDPOINT,
  KEYCLOAK_ENABLED,
} from "$env/static/private";
import prisma from "$lib/utils/prisma";
import type GroupRepresentation from "@keycloak/keycloak-admin-client/lib/defs/groupRepresentation";

const enabled = KEYCLOAK_ENABLED === "true";

async function connect() {
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

async function getUserId(client: KcAdminClient, username: string) {
  const response = await client.users.find({ username });
  if (response.length !== 1) {
    throw new Error(`${username} returned ${response.length} users`);
  }
  return response[0]!.id;
}

// turns dsek.sexm.kok.mastare into ['dsek', 'dsek.sexm', 'dsek.sexm.kok', 'dsek.sexm.kok.mastare']
function getRoleNames(id: string): string[] {
  const parts = id.split(".");
  return [...Array(parts.length).keys()].map((i) =>
    parts.slice(0, i + 1).join("."),
  );
}

async function getGroupId(client: KcAdminClient, positionId: string) {
  const roleNames = getRoleNames(positionId);
  const groups = await client.groups.find();
  let group = groups.find((g) => g.name === roleNames[0]);
  roleNames.slice(1).forEach((name) => {
    group = group?.subGroups?.find((g) => g.name === name);
  });
  if (!group) {
    throw new Error(`Failed to find group for position ${positionId}`);
  }
  return group?.id;
}

async function addMandate(username: string, positionId: string) {
  if (!enabled) return;

  try {
    const client = await connect();
    const id = await getUserId(client, username);
    const groupId = await getGroupId(client, positionId);
    await client.users.addToGroup({
      id: id!,
      groupId: groupId!,
    });
  } catch (error) {
    console.log(error);
  }
}

async function deleteMandate(username: string, positionId: string) {
  if (!enabled) return;

  try {
    const client = await connect();
    const id = await getUserId(client, username);
    const groupId = await getGroupId(client, positionId);
    await client.users.delFromGroup({
      id: id!,
      groupId: groupId!,
    });
  } catch (error) {
    console.log(error);
  }
}

async function updateMandate() {
  if (!enabled) return;

  const now = new Date().toISOString();

  const lastKeycloakUpdateResult = await prisma.lastKeycloakUpdate.findMany({
    take: 1,
    orderBy: [
      {
        id: "desc",
      },
    ],
    select: {
      time: true,
    },
  });
  const last = lastKeycloakUpdateResult[0]?.time ?? "1982-12-31T00:00:00.000Z";

  const result = await prisma.mandate.findMany({
    where: {
      endDate: {
        lte: now,
        gte: last,
      },
    },
    select: {
      positionId: true,
      member: {
        select: {
          studentId: true,
        },
      },
    },
  });

  console.log(`updating ${result.length} users`);

  result.forEach(async ({ positionId, member: { studentId } }) => {
    await deleteMandate(studentId!, positionId);
  });

  await prisma.lastKeycloakUpdate.create({
    data: {
      time: now,
    },
  });
}

export default {
  addMandate,
  deleteMandate,
  updateMandate,
};
