const {
    Client,
    GatewayIntentBits,
    Partials,
    Collection,
    ActivityType
} = require("discord.js");

const express = require("express");
const config = require("./config.json");

const app = express();
app.use(express.json());

/* ===========================
   CLIENT (ONLY ONCE)
=========================== */

const client = new Client({

    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ],

    partials: [Partials.Channel]
});

/* ===========================
   COLLECTIONS (optional)
=========================== */

client.commands = new Collection();

/* ===========================
   DASHBOARD ROUTES
=========================== */

app.get("/", (req, res) => {
    res.send("🤖 Bot is Online");
});

app.get("/status", (req, res) => {
    res.json({
        status: "online",
        guilds: client.guilds.cache.size,
        users: client.users.cache.size,
        ping: client.ws.ping
    });
});

/* ===========================
   INTERACTION EVENT
=========================== */

client.on("interactionCreate", async (interaction) => {
    require("./interactionCreate").execute(interaction, client);
});

/* ===========================
   READY EVENT
=========================== */

client.once("ready", () => {

    console.log(`🤖 Logged in as ${client.user.tag}`);

    client.user.setPresence({
        activities: [{
            name: "Broadcast System",
            type: ActivityType.Watching
        }],
        status: "online"
    });
});

/* ===========================
   ERROR HANDLING
=========================== */

process.on("unhandledRejection", (err) => {
    console.log("❌ Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
    console.log("❌ Uncaught Exception:", err);
});

/* ===========================
   START SERVER
=========================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🌐 Dashboard running on port ${PORT}`);
});

/* ===========================
   LOGIN BOT
=========================== */

client.login(process.env.TOKEN || config.TOKEN);
