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

  /* ================= PANEL ================= */
  if (cmd === "!panel") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ تحتاج Admin");

    const embed = new EmbedBuilder()
      .setColor("Gold")
      .setTitle("⚙️ لوحة التحكم")
      .setDescription("إدارة السيرفر والبوت");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("panel_help").setLabel("الأوامر").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("filter_toggle").setLabel("فلتر").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("stats_show").setLabel("إحصائيات").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("ban_user").setLabel("بان").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("mute_user").setLabel("كتم").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("set_bc_role").setLabel("رتبة BC").setStyle(ButtonStyle.Primary)
    );

    return message.reply({ embeds: [embed], components: [row] });
  }

  /* ================= FILTER ================= */
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
});

/* ================= BUTTONS ================= */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  /* ================= HELP PANEL ================= */
  if (interaction.customId === "panel_help") {
    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("📜 الأوامر")
      .setDescription(`
!panel → لوحة التحكم
!bc → برودكاست (للرتب المسموحة)
!setlog → تعيين اللوق
      `);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  /* ================= FILTER TOGGLE ================= */
  if (interaction.customId === "filter_toggle") {
    filterEnabled = !filterEnabled;
    return interaction.reply({
      content: filterEnabled ? "🟢 الفلتر شغال" : "🔴 الفلتر مطفي",
      ephemeral: true
    });
  }

  /* ================= STATS ================= */
  if (interaction.customId === "stats_show") {
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("📊 الإحصائيات")
      .addFields(
        { name: "السيرفرات", value: `${client.guilds.cache.size}`, inline: true },
        { name: "الأعضاء", value: `${client.users.cache.size}`, inline: true }
      );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  /* ================= SET BC ROLE ================= */
  if (interaction.customId === "set_bc_role") {
    const modal = new ModalBuilder()
      .setCustomId("bc_role_modal")
      .setTitle("تحديد رتبة BC");

    const input = new TextInputBuilder()
      .setCustomId("role_id")
      .setLabel("حط ID الرتبة")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }

  /* ================= BAN ================= */
  if (interaction.customId === "ban_user") {
    const modal = new ModalBuilder()
      .setCustomId("ban_modal")
      .setTitle("بان عضو");

    const input = new TextInputBuilder()
      .setCustomId("user_id")
      .setLabel("ID العضو")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }

  /* ================= MUTE ================= */
  if (interaction.customId === "mute_user") {
    const modal = new ModalBuilder()
      .setCustomId("mute_modal")
      .setTitle("كتم عضو");

    const input = new TextInputBuilder()
      .setCustomId("user_id")
      .setLabel("ID العضو")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }
});

/* ================= MODALS ================= */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  /* ================= BC ROLE SAVE ================= */
  if (interaction.customId === "bc_role_modal") {
    const roleId = interaction.fields.getTextInputValue("role_id");

    guilds[interaction.guild.id] = {
      ...guilds[interaction.guild.id],
      bcRole: roleId
    };

    fs.writeFileSync("./guilds.json", JSON.stringify(guilds, null, 2));

    return interaction.reply({ content: "✅ تم حفظ رتبة BC", ephemeral: true });
  }

  /* ================= BAN ================= */
  if (interaction.customId === "ban_modal") {
    const id = interaction.fields.getTextInputValue("user_id");

    const member = await interaction.guild.members.fetch(id).catch(() => null);
    if (!member) return interaction.reply({ content: "❌ ما لقيته", ephemeral: true });

    await member.ban();
    return interaction.reply({ content: "🔨 تم البان", ephemeral: true });
  }

  /* ================= MUTE ================= */
  if (interaction.customId === "mute_modal") {
    const id = interaction.fields.getTextInputValue("user_id");

    const member = await interaction.guild.members.fetch(id).catch(() => null);
    if (!member) return interaction.reply({ content: "❌ ما لقيته", ephemeral: true });

    await member.timeout(10 * 60 * 1000);
    return interaction.reply({ content: "🔇 تم الكتم", ephemeral: true });
  }
});

/* ================= LOGIN ================= */
client.login(process.env.TOKEN);
