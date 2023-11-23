import type { DiscordMember } from "@prisma/client";
import prisma from "../../src/lib/utils/prisma";
import type { Client, Message } from "discord.js";
import { config } from "../config";

export default async function confirmUserAction(
  client: Client<boolean>,
  discordUser: DiscordMember,
  message: Message<boolean>
) {
  await prisma.discordMember.update({
    where: {
      id: discordUser.id,
    },
    data: {
      discordId: message.author.id,
    },
  });
  await client.guilds.fetch(config.DISCORD_GUILD_ID).then(async (guild) => {
    await guild.members.fetch(message.author.id).then(async (member) => {
      const role = await guild.roles.fetch(config.DISCORD_ROLE_ID);
      if (!role) {
        await message.reply(
          `Something went wrong, the role could not be found. Please contact the administrators. dwww@dsek.se`
        );
        return;
      }
      await member.roles.add(role);
    });
  });
  await message.reply(
    `I have linked your Discord account to your student ID. You should now have the role "Authenticated".`
  );
}
