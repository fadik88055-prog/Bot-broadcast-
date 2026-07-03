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
    try {
        await require("./interactionCreate").execute(interaction, client);
    } catch (err) {
        console.error("INTERACTION ERROR:");
        console.error(err);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: "❌ صار خطأ داخل البوت.",
                ephemeral: true
            }).catch(() => {});
        }
    }
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
