import { Client, GatewayIntentBits, Partials } from "discord.js";
import { deployCommands } from "./deployCommands";
import { commands } from "./commands";
import { config } from "./config";
import prisma from "../src/lib/utils/prisma";
import initiateAccountConfirmationAction from "./actions/initiateConfirmationAction";
import confirmUserAction from "./actions/confirmUserAction";

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.once("ready", () => {
  console.log("Discord bot is ready! 🤖");
});

client.on("guildCreate", async (guild) => {
  await deployCommands({ guildId: guild.id });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }
  const { commandName } = interaction;
  if (commands[commandName as keyof typeof commands]) {
    commands[commandName as keyof typeof commands].execute(interaction);
  }
});

client.on("messageCreate", async (message) => {
  if (message.guild) return;
  if (message.author.bot) return;

  const user = await prisma.member.findFirst({
    where: {
      studentId: message.cleanContent,
    },
  });
  if (user) {
    initiateAccountConfirmationAction(user, message);
    return;
  }

  const discordUser = await prisma.discordMember.findFirst({
    where: {
      secretCode: message.cleanContent,
    },
  });
  if (discordUser) {
    await confirmUserAction(client, discordUser, message);
    return;
  }

  await message.reply(
    `Hello, I could not understand your message. Please reply with your student ID to verify your identity.`
  );
});

client.login(config.DISCORD_TOKEN);
