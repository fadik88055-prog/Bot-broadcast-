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

/* ================= FILES ================= */
let guilds = {};
let guildSettings = {};
let filterEnabled = true;

if (fs.existsSync("./guilds.json")) {
  guilds = JSON.parse(fs.readFileSync("./guilds.json", "utf8"));
}

if (fs.existsSync("./guildSettings.json")) {
  guildSettings = JSON.parse(fs.readFileSync("./guildSettings.json", "utf8"));
}

/* ================= SAVE SETTINGS ================= */
function setGuildIcon(guildId, iconUrl) {
  guildSettings[guildId] = {
    ...guildSettings[guildId],
    icon: iconUrl
  };

  fs.writeFileSync("./guildSettings.json", JSON.stringify(guildSettings, null, 2));
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

  const cmd = message.content.split(" ")[0].toLowerCase();
  const args = message.content.split(" ").slice(1);

  /* ================= PANEL ================= */
  if (cmd === "!panel") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Admin only");

    const icon = guildSettings[message.guild.id]?.icon;

    const embed = new EmbedBuilder()
      .setColor("Gold")
      .setTitle("⚙️ لوحة التحكم")
      .setDescription("إدارة السيرفر والبوت");

    if (icon) embed.setThumbnail(icon);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("bc_panel").setLabel("برودكاست").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("filter_toggle").setLabel("فلتر").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("set_icon").setLabel("صورة السيرفر").setStyle(ButtonStyle.Success)
    );

    return message.reply({ embeds: [embed], components: [row] });
  }

  /* ================= SET LOG ================= */
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

  /* ================= SET ICON (TEXT CMD) ================= */
  if (cmd === "!seticon") {
    const url = args[0];
    if (!url) return message.reply("❌ ضع رابط الصورة");

    setGuildIcon(message.guild.id, url);

    return message.reply("✅ تم حفظ صورة السيرفر");
  }

  /* ================= FILTER ================= */
  if (filterEnabled) {
    const badWords = [
      "گواد","قواد","كحبه","منيوج",
      "انيجك","انيچك","منيوجه","منيوچ",
      "منيوچه","انيچج","انيجج","منيوك"
    ];

    const msg = message.content.toLowerCase();

    if (badWords.some(w => msg.includes(w))) {
      await message.delete().catch(() => {});

      const warn = await message.reply("❌ ممنوع السب");
      setTimeout(() => warn.delete().catch(() => {}), 3000);

      const logId = guilds[message.guild.id]?.logChannel;

      if (logId) {
        const logChannel = message.guild.channels.cache.get(logId);

        if (logChannel) {
          logChannel.send({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setTitle("🚨 فلتر سب")
                .addFields(
                  { name: "المستخدم", value: `${message.author}` },
                  { name: "الرسالة", value: message.content.slice(0, 1024) }
                )
            ]
          }).catch(() => {});
        }
      }

      return;
    }
  }
});

/* ================= BUTTONS ================= */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  /* ================= BC PANEL ================= */
  if (interaction.customId === "bc_panel") {

    const modal = new ModalBuilder()
      .setCustomId("bc_modal")
      .setTitle("📢 برودكاست");

    const msgInput = new TextInputBuilder()
      .setCustomId("msg")
      .setLabel("الرسالة")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const typeInput = new TextInputBuilder()
      .setCustomId("type")
      .setLabel("all / online / offline")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(msgInput),
      new ActionRowBuilder().addComponents(typeInput)
    );

    return interaction.showModal(modal);
  }

  /* ================= SET ICON BUTTON ================= */
  if (interaction.customId === "set_icon") {

    const modal = new ModalBuilder()
      .setCustomId("icon_modal")
      .setTitle("صورة السيرفر");

    const input = new TextInputBuilder()
      .setCustomId("icon")
      .setLabel("رابط الصورة")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }
});

/* ================= MODALS ================= */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  /* ================= BROADCAST CONFIRM ================= */
  if (interaction.customId === "bc_modal") {

    const msg = interaction.fields.getTextInputValue("msg");
    const type = interaction.fields.getTextInputValue("type").toLowerCase();

    const confirm = new EmbedBuilder()
      .setColor("Yellow")
      .setTitle("⚠️ تأكيد البرودكاست")
      .addFields(
        { name: "النوع", value: type },
        { name: "الرسالة", value: msg.slice(0, 1024) }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("bc_yes").setLabel("تأكيد").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("bc_no").setLabel("إلغاء").setStyle(ButtonStyle.Danger)
    );

    interaction.reply({ embeds: [confirm], components: [row], ephemeral: true });

    client.once("interactionCreate", async (btn) => {
      if (!btn.isButton()) return;
      if (btn.customId === "bc_no") return btn.update({ content: "❌ تم الإلغاء", embeds: [], components: [] });

      if (btn.customId === "bc_yes") {

        let members = btn.guild.members.cache.filter(m => !m.user.bot);

        if (type === "online") {
          members = members.filter(m => m.presence && m.presence.status !== "offline");
        }

        if (type === "offline") {
          members = members.filter(m => !m.presence || m.presence.status === "offline");
        }

        let success = 0;
        let failed = 0;

        for (const m of members.values()) {
          try {
            await m.send(msg);
            success++;
          } catch {
            failed++;
          }
        }

        const logId = guilds[btn.guild.id]?.logChannel;
        if (logId) {
          const logChannel = btn.guild.channels.cache.get(logId);

          if (logChannel) {
            logChannel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor("Blue")
                  .setTitle("📢 Broadcast Log")
                  .addFields(
                    { name: "👤 بواسطة", value: `${btn.user}` },
                    { name: "📡 النوع", value: type },
                    { name: "📨 الرسالة", value: msg.slice(0, 1024) },
                    { name: "📊", value: `Success: ${success} | Failed: ${failed}` }
                  )
              ]
            });
          }
        }

        btn.update({
          content: `✅ تم الإرسال\nنجح: ${success}\nفشل: ${failed}`,
          embeds: [],
          components: []
        });
      }
    });
  }

  /* ================= ICON SAVE ================= */
  if (interaction.customId === "icon_modal") {
    const url = interaction.fields.getTextInputValue("icon");

    setGuildIcon(interaction.guild.id, url);

    return interaction.reply({
      content: "✅ تم حفظ صورة السيرفر",
      ephemeral: true
    });
  }
});

/* ================= LOGIN ================= */
client.login(process.env.TOKEN);
