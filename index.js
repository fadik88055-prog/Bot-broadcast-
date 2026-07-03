const {
    Client,
    GatewayIntentBits,
    Partials,
    ActivityType
} = require("discord.js");

const express = require("express");
const config = require("./config.json");

const app = express();
app.use(express.json());

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

/* ================= INTERACTIONS ================= */
client.on("interactionCreate", async (interaction) => {
    require("./interactionCreate").execute(interaction, client);
});

/* ================= READY ================= */
client.once("clientReady", () => {
    console.log(`Logged in as ${client.user.tag}`);

    client.user.setPresence({
        activities: [{
            name: "Broadcast Bot",
            type: ActivityType.Watching
        }],
        status: "online"
    });
});

/* ================= EXPRESS ================= */

app.get("/", (req, res) => {
    res.send("Bot is running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Dashboard running on", PORT);
});
const panel = require("./panel");
const messageCreate = require("./messageCreate");
const antiSpam = require("./antiSpam");

client.on("messageCreate", async (message) => {
    await panel.execute(message, client);
    await messageCreate.execute(message, client);
    await antiSpam.execute(message, client);
});

/* ================= LOGIN ================= */

client.login(process.env.TOKEN || config.TOKEN);
