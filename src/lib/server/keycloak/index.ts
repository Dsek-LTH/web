import KcAdminClient from "@keycloak/keycloak-admin-client";
import { env } from "$env/dynamic/private";
import type { PrismaClient } from "@prisma/client";
import { error } from "@sveltejs/kit";

const enabled = env.KEYCLOAK_ENABLED === "true";

async function connect(): Promise<KcAdminClient> {
  const kcAdminClient = new KcAdminClient({
    baseUrl: env.KEYCLOAK_ENDPOINT || "",
    realmName: "master",
  });

  await kcAdminClient.auth({
    username: env.KEYCLOAK_ADMIN_USERNAME || "",
    password: env.KEYCLOAK_ADMIN_PASSWORD || "",
    grantType: "password",
    clientId: "admin-cli",
  });

  kcAdminClient.setConfig({ realmName: "dsek" });

  return kcAdminClient;
}

async function _getUserId(client: KcAdminClient, username: string) {
  const response = await client.users.find({ username });
  if (response.length === 0) error(404, `${username} not found in Keycloak`);
  if (!response[0] || response.length !== 1)
    error(400, `${username} returned ${response.length} users in Keycloak`);

  return response[0].id;
}

async function getUserId(username: string) {
  if (!enabled) return;
  const client = await connect();
  try {
    return await _getUserId(client, username);
  } catch (error) {
    console.log(error);
    return null;
  }
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
    const id = await _getUserId(client, username);
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
    const id = await _getUserId(client, username);
    const groupId = await getGroupId(client, positionId);
    await client.users.delFromGroup({
      id: id!,
      groupId: groupId!,
    });
  } catch (error) {
    console.log(error);
  }
}

async function updateMandate(prisma: PrismaClient) {
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

// To reduce the amount of requests to Keycloak,
// we fetch all emails for all users in one request
// and then filter out the ones we need
async function getManyUserEmails(
  usernames: Set<string>,
): Promise<Map<string, string>> {
  if (!enabled) return new Map();
  const client = await connect();
  const userEmails = new Map<string, string>();

  (await client.users.find({ username: "" })).forEach((user) => {
    if (
      user.email !== undefined &&
      user.username !== undefined &&
      usernames.has(user.username)
    ) {
      userEmails.set(user.username, user.email);
    }
  });
  return userEmails;
}

async function hasUsername(username: string) {
  if (!enabled) return false;
  const client = await connect();
  const user = await client.users.find({ username });
  return user.filter((u) => u.username === username).length > 0;
}

async function hasEmail(email: string) {
  if (!enabled) return false;
  const client = await connect();
  const user = await client.users.find({ email });
  return user.filter((u) => u.email === email).length > 0;
}

async function getEmail(username: string) {
  if (!enabled) return;
  const client = await connect();
  const user = await client.users.find({ username });
  if (user.length === 1) return user[0]?.email;
}

export default {
  addMandate,
  deleteMandate,
  updateMandate,
  getUserId,
  getManyUserEmails,
  hasUsername,
  hasEmail,
  getEmail,
};
