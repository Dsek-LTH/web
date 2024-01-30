import KcAdminClient from "@keycloak/keycloak-admin-client";
import {
  KEYCLOAK_ADMIN_USERNAME,
  KEYCLOAK_ADMIN_PASSWORD,
  KEYCLOAK_ENDPOINT,
  KEYCLOAK_ENABLED,
} from "$env/static/private";
import prisma from "$lib/utils/prisma";

const enabled = KEYCLOAK_ENABLED === "true";
let client: KcAdminClient;

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
  client = kcAdminClient;
}

async function getId(username: string) {
  if (client === undefined) await connect();

  const response = await client.users.find({ username });
  if (response.length !== 1) {
    throw new Error(`for ${username} ${response.length} users returned`);
  }
  return response[0]!.id;
}

async function addMandate(username: string, positionId: string) {
  if (!enabled) return;

  try {
    const id = await getId(username);
    await client!.users.addToGroup({
      id: id!,
      groupId: positionId,
    });
  } catch (error) {
    console.log(error);
  }
}

async function deleteMandate(username: string, positionId: string) {
  if (!enabled) return;

  try {
    const id = await getId(username);
    await client!.users.delFromGroup({
      id: id!,
      groupId: positionId,
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
