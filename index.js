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

let guilds = {};

if (fs.existsSync("./guilds.json")) {
  guilds = JSON.parse(fs.readFileSync("./guilds.json", "utf8"));
}

client.once("ready", () => {
  console.log(`${client.user.tag} Online`);

  client.user.setPresence({
    activities: [{ name: "!help", type: ActivityType.Watching }],
    status: "online"
  });
});

/* ================= HELP ================= */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!help") {
    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("📖 أوامر البوت")
      .setDescription(`
!bc → برودكاست
!setlog → تحديد روم اللوق
!stats → إحصائيات البوت
!help → عرض الأوامر
      `);

    return message.reply({ embeds: [embed] });
  }
});

/* ================= STATS ================= */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!stats") {
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("📊 إحصائيات البوت")
      .addFields(
        { name: "السيرفرات", value: `${client.guilds.cache.size}`, inline: true },
        { name: "الأعضاء", value: `${client.users.cache.size}`, inline: true }
      );

    return message.reply({ embeds: [embed] });
  }
});

/* ================= SETLOG ================= */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!setlog")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ تحتاج Administrator");

    const channel = message.mentions.channels.first();
    if (!channel) return message.reply("❌ منشن روم");

    guilds[message.guild.id] = {
      logChannel: channel.id
    };

    fs.writeFileSync("./guilds.json", JSON.stringify(guilds, null, 2));

    return message.reply(`✅ تم تعيين اللوق في ${channel}`);
  }
});

/* ================= BC PANEL ================= */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!bc") {
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
        .setStyle(ButtonStyle.Secondary)
    );

    return message.reply({ embeds: [embed], components: [row] });
  }
});

/* ================= INTERACTIONS ================= */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() && !interaction.isModalSubmit()) return;

  /* فتح المودال */
  if (interaction.isButton()) {
    let modalId = "";

    if (interaction.customId === "bc_all") modalId = "modal_all";
    if (interaction.customId === "bc_online") modalId = "modal_online";
    if (interaction.customId === "bc_offline") modalId = "modal_offline";

    const modal = new ModalBuilder()
      .setCustomId(modalId)
      .setTitle("Broadcast");

    const input = new TextInputBuilder()
      .setCustomId("broadcast_message")
      .setLabel("اكتب الرسالة")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }

  /* إرسال البرودكاست */
  await interaction.deferReply({ ephemeral: true });

  const text = interaction.fields.getTextInputValue("broadcast_message");

  let members = interaction.guild.members.cache.filter(m => !m.user.bot);

  let success = 0;
  let failed = 0;

  for (const member of members.values()) {
    try {
      await member.send(`${text}\n\n<@${member.id}>`);
      success++;
    } catch {
      failed++;
    }
  }

  const result = new EmbedBuilder()
    .setColor("Green")
    .setTitle("✅ انتهى البرودكاست")
    .addFields(
      { name: "نجح", value: `${success}`, inline: true },
      { name: "فشل", value: `${failed}`, inline: true }
    );

  const logId = guilds[interaction.guild.id]?.logChannel;

  if (logId) {
    const logChannel = interaction.guild.channels.cache.get(logId);

    if (logChannel) {
      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Blue")
            .setTitle("📢 Broadcast Log")
            .addFields(
              { name: "بواسطة", value: `${interaction.user}` },
              { name: "الرسالة", value: text.substring(0, 1024) },
              { name: "نجاح", value: `${success}`, inline: true },
              { name: "فشل", value: `${failed}`, inline: true }
            )
        ]
      });
    }
  }

  await interaction.editReply({ embeds: [result] });
});

const token = process.env.TOKEN;

client.login(token);
