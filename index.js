const { Client, GatewayIntentBits, Partials, ActivityType } = require("discord.js");
const express = require("express");
const config = require("./config.json");

const app = express();
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
    try {
        await require("./interactionCreate").execute(interaction, client);
    } catch (err) {
        console.error("INTERACTION ERROR:", err);
    }
});

/* ================= EVENTS ================= */
const messageCreate = require("./messageCreate");
const antiSpam = require("./antiSpam");

client.on("messageCreate", async (message) => {
    await messageCreate.execute(message, client);
    await antiSpam.execute(message, client);
});

client.once("ready", () => {
    console.log(`✅ ${client.user.tag} يعمل الآن بنجاح على جميع السيرفرات!`);
    client.user.setPresence({
        activities: [{ name: "Broadcast Dashboard /panel", type: ActivityType.Custom }],
        status: "online"
    });
});

/* ================= EXPRESS ONLINE SERVER ================= */
app.get("/", (req, res) => { res.send("Bot is completely operational 24/7!"); });
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log("Web server active on port", PORT); });

client.login(config.TOKEN);
