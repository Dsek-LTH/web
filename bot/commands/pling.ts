import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("pling")
  .setDescription("Replies with plong!");

export async function execute(interaction: CommandInteraction) {
  return interaction.reply("plong!");
}
