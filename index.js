const fs = require("fs");

const {
Client,
GatewayIntentBits,
PermissionsBitField,
EmbedBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
ModalBuilder,
TextInputBuilder,
TextInputStyle,
ActivityType
} = require("discord.js");

const config = require("./config.json");

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers,
GatewayIntentBits.GuildPresences
]
});

let guilds = {};

if (fs.existsSync("./guilds.json")) {
guilds = JSON.parse(fs.readFileSync("./guilds.json", "utf8"));
}

client.once("ready", () => {

console.log(`${client.user.tag} Online`);

client.user.setPresence({
activities: [
{
name: "!bc",
.setCustomId("bc_offline")
.setLabel("الأوفلاين")
.setStyle(ButtonStyle.Secondary)

);

return message.reply({
embeds: [embed],
components: [row]
});

}

});
client.on("interactionCreate", async (interaction) => {

if (!interaction.isButton() && !interaction.isModalSubmit()) return;

if (interaction.isButton()) {

let modalId = "";

if (interaction.customId === "bc_all") modalId = "modal_all";
if (interaction.customId === "bc_online") modalId = "modal_online";
if (interaction.customId === "bc_offline") modalId = "modal_offline";

const modal = new ModalBuilder()
.setCustomId(modalId)
.setTitle("Broadcast");

const input = new TextInputBuilder()
.setCustomId("broadcast_message")
.setLabel("اكتب الرسالة")
.setStyle(TextInputStyle.Paragraph)
.setRequired(true);

modal.addComponents(
new ActionRowBuilder().addComponents(input)
);

return interaction.showModal(modal);

}

await interaction.deferReply({ ephemeral: true });

const text = interaction.fields.getTextInputValue("broadcast_message");

let members = interaction.guild.members.cache.filter(
m => !m.user.bot
);

if (interaction.customId === "modal_online") {
members = members.filter(
m => m.presence && m.presence.status !== "offline"
);
}

if (interaction.customId === "modal_offline") {
members = members.filter(
m => !m.presence || m.presence.status === "offline"
);
}

let success = 0;
let failed = 0;
  for (const member of members.values()) {

try {

await member.send({
content: `${text}\n\n<@${member.id}>`
});

success++;

} catch {

failed++;

}

}

const result = new EmbedBuilder()
.setColor("Green")
.setTitle("✅ انتهى البرودكاست")
.addFields(
{
name: "✅ تم الإرسال",
value: `${success}`,
inline: true
},
{
name: "❌ فشل",
value: `${failed}`,
inline: true
}
)
.setTimestamp();

const logId = guilds[interaction.guild.id]?.logChannel;

if (logId) {

const logChannel = interaction.guild.channels.cache.get(logId);

if (logChannel) {

const logEmbed = new EmbedBuilder()
.setColor("Blue")
.setTitle("📢 Broadcast Log")
.addFields(
{
name: "👤 بواسطة",
value: `${interaction.user}`,
inline: true
},
{
name: "📨 الرسالة",
value: text.substring(0, 1024)
},
{
name: "✅ نجاح",
value: `${success}`,
inline: true
},
{
name: "❌ فشل",
value: `${failed}`,
inline: true
}
)
.setTimestamp();

await logChannel.send({
embeds: [logEmbed]
});

}

}

await interaction.editReply({
embeds: [result]
});

});

const token = process.env.TOKEN || config.TOKEN;

client.login(token);

