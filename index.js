const fs = require("fs");
const express = require("express");
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

const app = express();
app.use(express.json());

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
    activities: [{ name: "!panel", type: ActivityType.Watching }],
    status: "online"
  });
});

/* ================= AUTH ================= */
const TOKEN = process.env.TOKEN;

function checkAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (auth !== TOKEN) return res.status(403).send("No access");
  next();
}

/* ================= BROADCAST API ================= */
app.post("/api/broadcast", checkAuth, async (req, res) => {
  const { guildId, message } = req.body;

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return res.status(404).send("Guild not found");

  let success = 0;
  let failed = 0;

  const members = await guild.members.fetch();

  for (const member of members.values()) {
    if (member.user.bot) continue;

    try {
      await member.send(message);
      success++;
    } catch {
      failed++;
    }
  }

  res.json({ success, failed });
});

/* ================= COMMAND API ================= */
app.post("/api/command", checkAuth, async (req, res) => {
  const { guildId, action, userId } = req.body;

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return res.status(404).send("Guild not found");

  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return res.status(404).send("User not found");

  if (action === "ban") {
    await member.ban().catch(() => {});
  }

  if (action === "kick") {
    await member.kick().catch(() => {});
  }

  res.json({ ok: true });
});

/* ================= PANEL ================= */
client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;

  if (message.content === "!panel") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return;

    const embed = new EmbedBuilder()
      .setColor("Gold")
      .setTitle("⚙ Control Panel");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("bc")
        .setLabel("Broadcast")
        .setStyle(ButtonStyle.Primary)
    );

    message.reply({ embeds: [embed], components: [row] });
  }
});

/* ================= INTERACTION ================= */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "bc") {
    interaction.reply({
      content: "📢 استخدم الداشبورد للبرودكاست",
      ephemeral: true
    });
  }
});

/* ================= EXPRESS SERVER ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🌐 API Running on port", PORT);
});

/* ================= LOGIN ================= */
client.login(process.env.TOKEN);
