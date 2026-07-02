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

/* ================= MESSAGE ================= */
client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;

  const content = message.content.trim();
  const cmd = content.split(" ")[0].toLowerCase();

  /* ================= COMMANDS FIRST ================= */

  // PANEL
  if (cmd === "!panel") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ تحتاج صلاحية Admin");

    const embed = new EmbedBuilder()
      .setColor("Gold")
      .setTitle("⚙️ لوحة التحكم")
      .setDescription("إدارة البوت والسيرفر");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("panel_help")
        .setLabel("الأوامر")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("filter_toggle")
        .setLabel("فلتر")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("stats_show")
        .setLabel("إحصائيات")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("ban_user")
        .setLabel("بان")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("mute_user")
        .setLabel("كتم")
        .setStyle(ButtonStyle.Secondary)
    );

    return message.reply({ embeds: [embed], components: [row] });
  }

  // SETLOG
  if (cmd === "!setlog") {
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply("❌ منشن روم");

    guilds[message.guild.id] = {
      ...guilds[message.guild.id],
      logChannel: channel.id
    };

    fs.writeFileSync("./guilds.json", JSON.stringify(guilds, null, 2));

    return message.reply("✅ تم تعيين اللوق");
  }

  /* ================= FILTER LAST (IMPORTANT FIX) ================= */
  if (filterEnabled) {
    const badWords = [
      "كلب","حمار","خرا","زبالة",
      "گواد","قواد","كحبه","منيوج",
      "انيجك","انيچك","منيوجه","منيوچ",
      "منيوچه","انيچج","انيجج","منيوك"
    ];

    const msg = content.toLowerCase();

    if (badWords.some(w => msg.includes(w))) {
      await message.delete().catch(() => {});

      const warn = await message.reply("❌ ممنوع السب");
      setTimeout(() => warn.delete().catch(() => {}), 3000);

      // LOG
      const logId = guilds[message.guild.id]?.logChannel;

      if (logId) {
        const logChannel = message.guild.channels.cache.get(logId);

        if (logChannel) {
          const embed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("🚨 فلتر سب")
            .addFields(
              { name: "المستخدم", value: `${message.author}`, inline: true },
              { name: "الرسالة", value: message.content.slice(0, 1024) }
            );

          logChannel.send({ embeds: [embed] }).catch(() => {});
        }
      }

      return;
    }
  }
});

/* ================= BUTTONS ================= */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "panel_help") {
    return interaction.reply({
      ephemeral: true,
      embeds: [
        new EmbedBuilder()
          .setColor("Blue")
          .setTitle("📜 الأوامر")
          .setDescription(`
!panel → لوحة التحكم
!setlog → تعيين اللوق
          `)
      ]
    });
  }

  if (interaction.customId === "filter_toggle") {
    filterEnabled = !filterEnabled;

    return interaction.reply({
      content: filterEnabled ? "🟢 الفلتر شغال" : "🔴 الفلتر مطفي",
      ephemeral: true
    });
  }

  if (interaction.customId === "stats_show") {
    return interaction.reply({
      ephemeral: true,
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("📊 الإحصائيات")
          .addFields(
            { name: "السيرفرات", value: `${client.guilds.cache.size}`, inline: true },
            { name: "الأعضاء", value: `${client.users.cache.size}`, inline: true }
          )
      ]
    });
  }
});

/* ================= LOGIN ================= */
client.login(process.env.TOKEN);
