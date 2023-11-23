import type { Member } from "@prisma/client";
import prisma from "../../src/lib/utils/prisma";
import type { Message } from "discord.js";
import { randomUUID } from "crypto";
import { config } from "../config";

export default async function initiateAccountConfirmationAction(
  user: Member,
  message: Message<boolean>
) {
  await message.reply(
    `Your name is ${user.firstName} ${user.lastName}, and you are a ${user.classYear} year student.`
  );
  let discordUser = await prisma.discordMember.findFirst({
    where: {
      memberId: user.id,
    },
  });
  if (!discordUser) {
    discordUser = await prisma.discordMember.create({
      data: {
        memberId: user.id,
        secretCode: randomUUID(),
      },
    });
  } else {
    await prisma.discordMember.update({
      where: {
        id: discordUser.id,
      },
      data: {
        secretCode: randomUUID(),
      },
    });
  }
  await message.reply(
    `I have created a secret code that is only visible to you on [your profile](${config.APP_URL}/members/${user.studentId}). Please reply with the secret code to verify your identity.`
  );
  return;
}
