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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

/* ================= DATA ================= */
let guilds = {};
let filterEnabled = true;

if (fs.existsSync("./guilds.json")) {
  guilds = JSON.parse(fs.readFileSync("./guilds.json", "utf8"));
}

/* ================= READY ================= */
client.once("ready", () => {
  console.log(`${client.user.tag} Online`);

  client.user.setPresence({
    activities: [{ name: "!panel", type: ActivityType.Watching }],
    status: "online"
  });
});

/* ================= PANEL COMMAND ================= */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const cmd = message.content.split(" ")[0];

  /* PANEL */
  if (cmd === "!panel") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ تحتاج Admin");

    const embed = new EmbedBuilder()
      .setColor("Gold")
      .setTitle("⚙️ لوحة التحكم")
      .setDescription("إدارة البوت من هنا");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("filter_toggle")
        .setLabel(filterEnabled ? "إيقاف الفلتر" : "تشغيل الفلتر")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("show_stats")
        .setLabel("الإحصائيات")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("setlog_fast")
        .setLabel("تعيين اللوق")
        .setStyle(ButtonStyle.Secondary)
    );

    return message.reply({ embeds: [embed], components: [row] });
  }

  /* FILTER */
  if (filterEnabled) {
    const badWords = [
      "كلب","حمار","خرا","زبالة",
      "گواد","قواد","كحبه","منيوج",
      "انيجك","انيچك","منيوجه","منيوچ",
      "منيوچه","انيچج","انيجج","منيوك"
    ];

    const msg = message.content.toLowerCase();

    if (badWords.some(w => msg.includes(w))) {
      await message.delete().catch(() => {});
      return message.reply("❌ ممنوع السب").then(m => {
        setTimeout(() => m.delete().catch(() => {}), 3000);
      });
    }
  }

  /* SETLOG COMMAND (قديمة) */
  if (cmd === "!setlog") {
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply("❌ منشن روم");

    guilds[message.guild.id] = { logChannel: channel.id };
    fs.writeFileSync("./guilds.json", JSON.stringify(guilds, null, 2));

    return message.reply("✅ تم تعيين اللوق");
  }
});

/* ================= BUTTONS ================= */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  /* TOGGLE FILTER */
  if (interaction.customId === "filter_toggle") {
    filterEnabled = !filterEnabled;

    return interaction.reply({
      content: filterEnabled ? "🟢 تم تشغيل الفلتر" : "🔴 تم إيقاف الفلتر",
      ephemeral: true
    });
  }

  /* STATS */
  if (interaction.customId === "show_stats") {
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("📊 الإحصائيات")
      .addFields(
        { name: "السيرفرات", value: `${client.guilds.cache.size}`, inline: true },
        { name: "الأعضاء", value: `${client.users.cache.size}`, inline: true }
      );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  /* FAST SETLOG */
  if (interaction.customId === "setlog_fast") {
    const modal = new ModalBuilder()
      .setCustomId("setlog_modal")
      .setTitle("تعيين اللوق");

    const input = new TextInputBuilder()
      .setCustomId("log_channel")
      .setLabel("اكتب ID الروم")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }
});

/* ================= MODAL ================= */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  if (interaction.customId === "setlog_modal") {
    const id = interaction.fields.getTextInputValue("log_channel");

    guilds[interaction.guild.id] = { logChannel: id };
    fs.writeFileSync("./guilds.json", JSON.stringify(guilds, null, 2));

    return interaction.reply({
      content: "✅ تم حفظ اللوق",
      ephemeral: true
    });
  }
});

/* ================= LOGIN ================= */
client.login(process.env.TOKEN);
