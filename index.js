const express = require("express");
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
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

/* ================= READY ================= */
client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: "Dashboard Bot", type: ActivityType.Watching }],
    status: "online"
  });
});

/* ================= AUTH ================= */
const TOKEN = process.env.TOKEN;

function checkAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || auth !== TOKEN) {
    return res.status(403).send("No access");
  }
  next();
}

/* ================= BROADCAST API ================= */
app.post("/api/broadcast", checkAuth, async (req, res) => {
  const { guildId, message } = req.body;

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return res.status(404).send("Guild not found");

  let success = 0;
  let failed = 0;

  try {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= COMMAND API ================= */
app.post("/api/command", checkAuth, async (req, res) => {
  const { guildId, action, userId } = req.body;

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return res.status(404).send("Guild not found");

  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return res.status(404).send("User not found");

  try {
    if (action === "ban") await member.ban();
    if (action === "kick") await member.kick();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= SIMPLE PANEL COMMAND ================= */
client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;

  if (message.content === "!panel") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    message.reply("⚙ Bot Panel is running");
  }
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🌐 API running on port", PORT);
});

/* ================= LOGIN BOT ================= */
client.login(process.env.TOKEN);
