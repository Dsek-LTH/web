import { env } from "$env/dynamic/private";
import type { PrismaClient } from "@prisma/client";
import { error } from "@sveltejs/kit";
import { promiseAllInBatches } from "$lib/utils/batch";

import { Configuration, type Group } from "@goauthentik/api";
import { CoreApi } from "@goauthentik/api";
import { fetchAll } from "./helpers";

const AUTHENTIK_BOARD_GROUP = "dsek.styr";

const enabled = env.AUTHENTIK_ENABLED === "true";

const CONFIG = new Configuration({
  basePath: env.AUTHENTIK_ENDPOINT,
  accessToken: env.AUTHENTIK_API_TOKEN,
});

const client = new CoreApi(CONFIG);

function connect(): CoreApi {
  return client;
}

async function _fetchUserId(client: CoreApi, username: string) {
  const response = (await client.coreUsersList({ username })).results;
  if (response.length === 0) {
    error(404, {
      message: `${username} not found in authenitk`,
      statusDescription: "shouldmarksynced",
    });
  }
  if (!response[0] || response.length !== 1) {
    error(400, {
      message: `${username} returned ${response.length} users in authentik`,
    });
  }

  return response[0].pk;
}

async function getUserId(username: string) {
  if (!enabled) return;
  const client = connect();
  try {
    return await _fetchUserId(client, username);
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function getGroupId(positionId: string, groups: Group[]) {
  const group = groups.find((g) => g.name === positionId);

  if (!group) {
    throw error(404, {
      message: `Failed to find group for position ${positionId}`,
      statusDescription: "shouldmarksynced",
    });
  }
  return group.pk;
}

async function updateProfile(
  username: string,
  firstName: string,
  lastName: string,
) {
  if (!enabled) return;

  try {
    const client = connect();
    const id = await _fetchUserId(client, username);
    await client.coreUsersPartialUpdate({
      id: id,
      patchedUserRequest: {
        name: `${firstName} ${lastName}`,
        attributes: {
          givenName: firstName,
          sn: lastName,
        },
      },
    });
  } catch (error) {
    console.log(error);
  }
}

// Checks if the position is a board member from the database
async function isBoardPosition(prisma: PrismaClient, positionId: string) {
  const position = await prisma.position.findFirst({
    where: { id: positionId },
  });
  return position?.boardMember ?? false;
}

async function hasAnyBoardPosition(prisma: PrismaClient, studentId: string) {
  const boardPosition = await prisma.mandate.findFirst({
    where: {
      member: { studentId },
      endDate: { gt: new Date() },
      position: { boardMember: true },
    },
  });
  return boardPosition !== null;
}

async function fetchGroupsAddMandate(
  prisma: PrismaClient,
  username: string,
  positionId: string,
  mandateId: string,
) {
  if (!enabled) return;
  try {
    const client = connect();
    await addMandate(
      prisma,
      username,
      positionId,
      mandateId,
      await fetchAll(client.coreGroupsList.bind(client)),
    );
  } catch (error) {
    console.log(error);
  }
}

async function addMandate(
  prisma: PrismaClient,
  username: string,
  positionId: string,
  mandateId: string,
  groups: Group[],
) {
  if (!enabled) return;

  try {
    const client = connect();

    const [id, groupId] = await Promise.all([
      _fetchUserId(client, username),
      getGroupId(positionId, groups),
    ]);
    await client.coreGroupsAddUserCreate({
      groupUuid: groupId,
      userAccountRequest: { pk: id },
    });

    // Special case for board members
    if (await isBoardPosition(prisma, positionId)) {
      const boardGroupId = await getGroupId(AUTHENTIK_BOARD_GROUP, groups);
      await client.coreGroupsAddUserCreate({
        groupUuid: boardGroupId!,
        userAccountRequest: { pk: id! },
      });
    }
    await prisma.mandate.update({
      where: { id: mandateId },
      data: {
        lastSynced: new Date(),
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Error has to be any or unknown
  } catch (error: any) {
    console.log("addmandate sync error: ", error);
    if (error.body?.statusDescription !== "shouldmarksynced") {
      throw error;
    }
  }
}

async function fetchGroupsDeleteMandate(
  prisma: PrismaClient,
  username: string,
  positionId: string,
  mandateId: string,
) {
  if (!enabled) return;
  try {
    const client = connect();
    await deleteMandate(
      prisma,
      username,
      positionId,
      mandateId,
      await fetchAll(client.coreGroupsList.bind(client)),
    );
  } catch (error) {
    console.log(error);
  }
}

async function deleteMandate(
  prisma: PrismaClient,
  username: string,
  positionId: string,
  mandateId: string,
  groups: Group[],
) {
  if (!enabled) return;

  try {
    const client = connect();
    const [id, groupId] = await Promise.all([
      _fetchUserId(client, username),
      getGroupId(positionId, groups),
    ]);
    await client.coreGroupsRemoveUserCreate({
      groupUuid: groupId,
      userAccountRequest: { pk: id },
    });

    // Special case for board members
    if (
      (await isBoardPosition(prisma, positionId)) && // if the position is a board member
      !(await hasAnyBoardPosition(prisma, username)) // if the user has no other board positions
    ) {
      const boardGroupId = await getGroupId(AUTHENTIK_BOARD_GROUP, groups);
      await client.coreGroupsRemoveUserCreate({
        groupUuid: boardGroupId,
        userAccountRequest: { pk: id! },
      });
    }
    await prisma.mandate.update({
      where: { id: mandateId },
      data: {
        lastSynced: new Date(),
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Error has to be any or unknown
  } catch (error: any) {
    console.log("deletemandate sync error: ", error);
    if (error.body?.statusDescription === "shouldmarksynced") {
      await prisma.mandate.update({
        where: { id: mandateId },
        data: {
          lastSynced: new Date(),
        },
      });
    } else {
      console.log(error);
    }
  }
}

async function updateMandate(prisma: PrismaClient) {
  if (!enabled) return;

  const now = new Date().toISOString();

  const [mandatesToBeDeleted, mandatesToBeAdded] = await Promise.all([
    prisma.mandate.findMany({
      where: {
        AND: [
          { endDate: { gt: prisma.mandate.fields.lastSynced } },
          { endDate: { lt: now } },
        ],
      },
      select: {
        id: true,
        positionId: true,
        member: { select: { studentId: true } },
      },
    }),
    prisma.mandate.findMany({
      where: {
        AND: [
          { startDate: { gt: prisma.mandate.fields.lastSynced } },
          { startDate: { lt: now } },
          { endDate: { gt: now } },
        ],
      },
      select: {
        id: true,
        positionId: true,
        member: { select: { studentId: true } },
      },
    }),
  ]);
  console.log(
    `[${new Date().toISOString()}] adding ${mandatesToBeAdded.length} users to groups, deleting ${mandatesToBeDeleted.length} users from groups`,
  );

  try {
    const client = connect();
    const groups = await fetchAll(client.coreGroupsList.bind(client));

    await promiseAllInBatches(
      mandatesToBeDeleted,
      async ({ positionId, member: { studentId }, id }) => {
        await deleteMandate(prisma, studentId!, positionId, id, groups);
      },
      10,
    );
    await promiseAllInBatches(
      mandatesToBeAdded,
      async ({ positionId, member: { studentId }, id }) => {
        await addMandate(prisma, studentId!, positionId, id, groups);
      },
      10,
    );
  } catch (error) {
    console.log(error);
  }
}

async function updateEmails(prisma: PrismaClient) {
  if (!enabled) return;

  const currentUserEmail = (
    await prisma.member.findMany({
      select: {
        studentId: true,
        email: true,
      },
      distinct: ["studentId"],
    })
  ).reduce((acc, curr) => {
    if (curr.studentId) acc.set(curr.studentId, curr.email);
    return acc;
  }, new Map<string, string | null>());

  if (currentUserEmail.size === 0) {
    console.log(
      `[${new Date().toISOString()}] email sync aborted, no users in database`,
    );
    return;
  }

  const userEmails = await getManyUserEmails(currentUserEmail);
  console.log(
    `[${new Date().toISOString()}] updating ${userEmails.size} emails`,
  );

  for (const [studentId, email] of userEmails) {
    try {
      await prisma.member.update({
        where: {
          studentId,
        },
        data: {
          email,
        },
      });
    } catch (error) {
      console.log("Failed to update email for", studentId, email);
      console.log(error);
    }
  }
}

// To reduce the amount of requests to authentik,
// we fetch all emails for all users in one request
// and then filter out the ones we need
async function getManyUserEmails(
  currentUserEmail: Map<string, string | null>,
): Promise<Map<string, string>> {
  if (!enabled) return new Map();
  const client = connect();
  const userEmails = new Map<string, string>();

  try {
    const users = await fetchAll(client.coreUsersList.bind(client));

    users.forEach((user) => {
      const { username, email } = user;
      if (!username || !email) return;

      if (
        currentUserEmail.has(username) && // if the user exists in our database
        currentUserEmail.get(username) !== user.email // if the email has changed
      ) {
        userEmails.set(username, email);
      }
    });
    return userEmails;
  } catch (error) {
    console.log(error);
    return new Map();
  }
}

async function hasUsername(username: string) {
  if (!enabled) return false;
  const client = connect();
  const user = (await client.coreUsersList({ username })).results;
  return user.filter((u) => u.username === username).length > 0;
}

async function hasEmail(email: string) {
  if (!enabled) return false;
  const client = connect();
  const user = (await client.coreUsersList({ email })).results;
  return user.filter((u) => u.email === email).length > 0;
}

async function getEmail(username: string) {
  if (!enabled) return;
  const client = connect();
  const user = (await client.coreUsersList({ username })).results;
  if (user.length === 1) return user[0]?.email;
}

/**
 * This function exists to keep authentik's
 * database in sync with the Prisma database.
 * It should be run periodically.
 *
 * Note that this function is currently incomplete since:
 * 1. It is not bi-directional: mandates are pushed and emails are pulled.
 * 2. It doesn't sync everything: member names, `dsek.styr`, etc?
 */
async function sync(prisma: PrismaClient) {
  updateMandate(prisma);
  updateEmails(prisma);
}

export default {
  updateProfile,
  fetchGroupsAddMandate,
  addMandate,
  fetchGroupsDeleteMandate,
  deleteMandate,
  getUserId,
  getManyUserEmails,
  hasUsername,
  hasEmail,
  getEmail,
  sync,
};
