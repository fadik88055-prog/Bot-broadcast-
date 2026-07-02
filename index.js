const {
Client,
GatewayIntentBits,
Partials,
Collection,
ActivityType
} = require("discord.js");

const express = require("express");
const fs = require("fs");
const path = require("path");

const config = require("./config.json");

const app = express();

app.use(express.json());

const client = new Client({

intents: [

GatewayIntentBits.Guilds,

GatewayIntentBits.GuildMembers,

GatewayIntentBits.GuildMessages,

GatewayIntentBits.MessageContent,

GatewayIntentBits.DirectMessages,

GatewayIntentBits.GuildPresences

],

partials: [

Partials.Channel,

Partials.Message,

Partials.User

]

});

client.commands = new Collection();
client.cooldowns = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.modals = new Collection();

client.config = config;

client.uptime = Date.now();
/* ================= EXPRESS ================= */

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {

res.send("Broadcast Dashboard Bot Online");

});

app.get("/status", (req, res) => {

res.json({

status: "online",

guilds: client.guilds.cache.size,

users: client.users.cache.size,

uptime: process.uptime()

});

});

app.listen(PORT, () => {

console.log(`🌐 Dashboard Running On ${PORT}`);

});
/* ===========================
   CREATE REQUIRED FOLDERS
=========================== */

const folders = [
    "./commands",
    "./events",
    "./handlers",
    "./filters",
    "./logs",
    "./data",
    "./utils"
];

for (const folder of folders) {

    if (!fs.existsSync(folder)) {

        fs.mkdirSync(folder, {
            recursive: true
        });

        console.log(`📁 Created Folder: ${folder}`);

    }

}

/* ===========================
   CREATE DEFAULT DATA FILES
=========================== */

const files = [

    "./data/settings.json",
    "./data/warnings.json",
    "./data/broadcast.json",
    "./data/logs.json"

];

for (const file of files) {

    if (!fs.existsSync(file)) {

        fs.writeFileSync(file, JSON.stringify({}, null, 4));

        console.log(`📄 Created File: ${file}`);

    }

}
/* ===========================
   READY
=========================== */

client.once("ready", () => {

    console.clear();

    console.log("======================================");
    console.log(`🤖 Logged In : ${client.user.tag}`);
    console.log(`🌍 Servers   : ${client.guilds.cache.size}`);
    console.log(`👥 Users     : ${client.users.cache.size}`);
    console.log("======================================");

    client.user.setPresence({

        activities: [

            {

                name: config.status.text,

                type: ActivityType.Watching

            }

        ],

        status: "online"

    });

});
/* ===========================
   ERROR HANDLER
=========================== */

process.on("unhandledRejection", (reason) => {

    console.log("========================================");
    console.log("❌ Unhandled Rejection");
    console.error(reason);
    console.log("========================================");

});

process.on("uncaughtException", (error) => {

    console.log("========================================");
    console.log("❌ Uncaught Exception");
    console.error(error);
    console.log("========================================");

});

process.on("warning", (warning) => {

    console.log("========================================");
    console.log("⚠ Warning");
    console.warn(warning);
    console.log("========================================");

});

/* ===========================
   MESSAGE EVENTS
=========================== */

client.on("messageCreate", async (message) => {

    require("./messageCreate").execute(message, client);
    require("./antiSpam").execute(message, client);

});

function logEvent(data) {

    const logs = fs.existsSync("./logs.json")
        ? JSON.parse(fs.readFileSync("./logs.json", "utf8"))
        : {};

    const id = Date.now().toString();

    logs[id] = {
        ...data,
        time: new Date().toISOString()
    };

    fs.writeFileSync("./logs.json", JSON.stringify(logs, null, 4));
}
client.logEvent = logEvent;
const { Client, GatewayIntentBits } = require("discord.js");
const config = require("./config.json");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});
/* ===========================
   EVENT (IMPORTANT)
=========================== */

client.on("interactionCreate", async (interaction) => {
    require("./interactionCreate").execute(interaction, client);
});
/* ===========================
   LOGIN
=========================== */

client.login(process.env.TOKEN || config.TOKEN)
