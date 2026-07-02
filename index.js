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

/* ================= GUILDS DATA ================= */
let guilds = {};

if (fs.existsSync("./guilds.json")) {
  guilds = JSON.parse(fs.readFileSync("./guilds.json", "utf8"));
}

/* ================= READY ================= */
client.once("ready", () => {
  console.log(`${client.user.tag} Online`);

  client.user.setPresence({
    activities: [{ name: "!help", type: ActivityType.Watching }],
    status: "online"
  });
});

/* ================= MESSAGE COMMANDS ================= */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  /* ================= FILTER + LOG ================= */
  const badWords = [
    "كلب","حمار","خرا","زبالة",
    "گواد","قواد","كحبه","منيوج",
    "انيجك","انيچك","منيوجه","منيوچ",
    "منيوچه","انيچج","انيجج","منيوك"
  ];

  const msg = message.content.toLowerCase();

  if (badWords.some(word => msg.includes(word))) {

    await message.delete().catch(() => {});

    const warnMsg = await message.reply("❌ ممنوع السب بالسيرفر");

    setTimeout(() => warnMsg.delete().catch(() => {}), 3000);

    const logId = guilds[message.guild.id]?.logChannel;

    if (logId) {
      const logChannel = message.guild.channels.cache.get(logId);

      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("🚨 فلتر سب")
          .addFields(
            { name: "👤 المستخدم", value: `${message.author}`, inline: true },
            { name: "💬 الرسالة", value: message.content.substring(0, 1024) },
            { name: "🏠 السيرفر", value: `${message.guild.name}` }
          )
          .setTimestamp();

        logChannel.send({ embeds: [logEmbed] }).catch(() => {});
      }
    }

    return;
  }

  const cmd = message.content.split(" ")[0];

  /* ================= HELP ================= */
  if (cmd === "!help") {
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Blue")
          .setTitle("📖 الأوامر")
          .setDescription(`
!bc → برودكاست
!setlog → تعيين اللوق
!stats → إحصائيات
!help → عرض الأوامر
          `)
      ]
    });
  }

  /* ================= STATS ================= */
  if (cmd === "!stats") {
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("📊 إحصائيات")
          .addFields(
            { name: "السيرفرات", value: `${client.guilds.cache.size}`, inline: true },
            { name: "الأعضاء", value: `${client.users.cache.size}`, inline: true }
          )
      ]
    });
  }

  /* ================= SETLOG ================= */
  if (cmd === "!setlog") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ تحتاج Administrator");

    const channel = message.mentions.channels.first();
    if (!channel) return message.reply("❌ منشن روم");

    guilds[message.guild.id] = {
      logChannel: channel.id
    };

    fs.writeFileSync("./guilds.json", JSON.stringify(guilds, null, 2));

    return message.reply(`✅ تم تعيين اللوق`);
  }

  /* ================= BC ================= */
  if (cmd === "!bc") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ تحتاج Administrator");

    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("📢 لوحة البرودكاست")
      .setDescription("اختر نوع الإرسال");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("bc_all")
        .setLabel("الجميع")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("bc_online")
        .setLabel("الأونلاين")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("bc_offline")
        .setLabel("الأوفلاين")
        .set
