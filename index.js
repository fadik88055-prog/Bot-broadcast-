const fs = require("fs");
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActivityType
} = require("discord.js");

/* ================= BOT ================= */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

/* ================= FILES ================= */
let guilds = {};

if (fs.existsSync("./guilds.json")) {
  guilds = JSON.parse(fs.readFileSync("./guilds.json", "utf8"));
}

/* ================= DASHBOARD ================= */
require("./dashboard");

/* ================= READY ================= */
client.once("ready", () => {
  console.log(`${client.user.tag} Online`);

  client.user.setPresence({
    activities: [
      {
        name: "!panel",
        type: ActivityType.Watching
      }
    ],
    status: "online"
  });
});

/* ================= MESSAGE ================= */
client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;

  if (message.content === "!panel") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ تحتاج صلاحية Admin");

    const embed = new EmbedBuilder()
      .setColor("Gold")
      .setTitle("⚙️ Control Panel")
      .setDescription("Dashboard + Broadcast");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("bc")
        .setLabel("Broadcast")
        .setStyle(ButtonStyle.Primary)
    );

    return message.reply({
      embeds: [embed],
      components: [row]
    });
  }
});

/* ================= INTERACTIONS ================= */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "bc") {
    return interaction.reply({
      content: "📢 استخدم الداشبورد لإرسال البرودكاست",
      ephemeral: true
    });
  }
});

/* ================= LOGIN ================= */
client.login(process.env.TOKEN);
