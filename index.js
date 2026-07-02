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

/* ================= PANEL ================= */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const cmd = message.content.split(" ")[0];

  if (cmd === "!panel") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ تحتاج Admin");

    const embed = new EmbedBuilder()
      .setColor("Gold")
      .setTitle("⚙️ لوحة التحكم")
      .setDescription("إدارة السيرفر والبوت");

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
        .setCustomId("ban_user")
        .setLabel("بان عضو")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("mute_user")
        .setLabel("كتم عضو")
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

  /* SETLOG */
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

  /* FILTER */
  if (interaction.customId === "filter_toggle") {
    filterEnabled = !filterEnabled;
    return interaction.reply({
      content: filterEnabled ? "🟢 الفلتر شغال" : "🔴 الفلتر مطفي",
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

  /* BAN MODAL */
  if (interaction.customId === "ban_user") {
    const modal = new ModalBuilder()
      .setCustomId("ban_modal")
      .setTitle("بان عضو");

    const input = new TextInputBuilder()
      .setCustomId("user_id")
      .setLabel("اكتب ID العضو")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }

  /* MUTE MODAL */
  if (interaction.customId === "mute_user") {
    const modal = new ModalBuilder()
      .setCustomId("mute_modal")
      .setTitle("كتم عضو (10 دقائق)");

    const input = new TextInputBuilder()
      .setCustomId("user_id")
      .setLabel("اكتب ID العضو")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }
});

/* ================= MODALS ================= */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  /* BAN */
  if (interaction.customId === "ban_modal") {
    const id = interaction.fields.getTextInputValue("user_id");

    try {
      const member = await interaction.guild.members.fetch(id);
      await member.ban({ reason: "Banned from panel" });

      return interaction.reply({
        content: "🔨 تم تبنيد العضو",
        ephemeral: true
      });
    } catch {
      return interaction.reply({
        content: "❌ فشل البان",
        ephemeral: true
      });
    }
  }

  /* MUTE */
  if (interaction.customId === "mute_modal") {
    const id = interaction.fields.getTextInputValue("user_id");

    try {
      const member = await interaction.guild.members.fetch(id);

      await member.timeout(10 * 60 * 1000, "Muted from panel");

      return interaction.reply({
        content: "🔇 تم كتم العضو 10 دقائق",
        ephemeral: true
      });
    } catch {
      return interaction.reply({
        content: "❌ فشل الكتم",
        ephemeral: true
      });
    }
  }
});

/* ================= LOGIN ================= */
client.login(process.env.TOKEN);
