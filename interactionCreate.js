const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

const config = require("./config.json");

module.exports = {
    name: "interactionCreate",

    async execute(interaction, client) {

        if (!interaction.guild) return;

        const { customId } = interaction;

        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

        const logChannel = interaction.guild.channels.cache.get(config.logChannelId);

        // ================= CLOSE =================

        if (interaction.isButton() && customId === "close_panel") {
            return interaction.update({
                content: "❌ تم إغلاق اللوحة",
                embeds: [],
                components: []
            });
        }

        // ================= BROADCAST =================

        if (interaction.isButton() && customId === "broadcast") {

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
                return interaction.reply({ content: "❌ ما عندك صلاحية", ephemeral: true });

            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle("📢 Broadcast System");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("bc_dm")
                    .setLabel("📨 DM")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId("bc_channel")
                    .setLabel("📢 Channel")
                    .setStyle(ButtonStyle.Success)
            );

            return interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });
        }

        // ================= MODERATION =================

        if (interaction.isButton() && customId === "moderation") {

            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle("👮 Moderation");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("kick_user").setLabel("Kick").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId("ban_user").setLabel("Ban").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId("timeout_user").setLabel("Timeout").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("clear_chat").setLabel("Clear").setStyle(ButtonStyle.Primary)
            );

            return interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });
        }

        // ================= STATISTICS =================

        if (interaction.isButton() && customId === "statistics") {

            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle("📊 Statistics")
                .addFields(
                    { name: "Servers", value: `${client.guilds.cache.size}`, inline: true },
                    { name: "Users", value: `${client.users.cache.size}`, inline: true },
                    { name: "Ping", value: `${client.ws.ping}ms`, inline: true }
                );

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }
        // ================= PROTECTION =================

if (interaction.isButton() && customId === "protection") {

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle("🛡 Protection")
        .setDescription("اختر النظام.");

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("anti_spam")
            .setLabel("🚫 Anti Spam")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId("bad_words")
            .setLabel("🚷 Bad Words")
            .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
    });
}

// ================= SETTINGS =================

if (interaction.isButton() && customId === "settings") {

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle("⚙️ Settings");

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("set_logs")
            .setLabel("📜 Logs")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId("set_image")
            .setLabel("🖼 Image")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("set_color")
            .setLabel("🎨 Color")
            .setStyle(ButtonStyle.Success)
    );

    return interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
    });
}

// ================= DEVELOPER =================

if (interaction.isButton() && customId === "developer") {

    if (interaction.user.id !== config.ownerID)
        return interaction.reply({
            content: "❌ هذا الزر للمطور فقط.",
            ephemeral: true
        });

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle("👑 Developer Panel");

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("bot_info")
            .setLabel("🤖 Bot Info")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId("reload_bot")
            .setLabel("🔄 Reload")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("shutdown_bot")
            .setLabel("🛑 Shutdown")
            .setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
    });
}
        // ================= BOT INFO =================

if (interaction.isButton() && customId === "bot_info") {

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle("🤖 معلومات البوت")
        .addFields(
            { name: "📡 Ping", value: `${client.ws.ping}ms`, inline: true },
            { name: "🌍 Servers", value: `${client.guilds.cache.size}`, inline: true },
            { name: "👥 Users", value: `${client.users.cache.size}`, inline: true },
            { name: "🆔 Bot ID", value: client.user.id }
        );

    return interaction.reply({
        embeds: [embed],
        ephemeral: true
    });
}

// ================= RELOAD =================

if (interaction.isButton() && customId === "reload_bot") {

    if (interaction.user.id !== config.ownerID)
        return interaction.reply({
            content: "❌ هذا الزر للمطور فقط.",
            ephemeral: true
        });

    return interaction.reply({
        content: "✅ تم تحديث اللوحة.",
        ephemeral: true
    });
}

// ================= SHUTDOWN =================

if (interaction.isButton() && customId === "shutdown_bot") {

    if (interaction.user.id !== config.ownerID)
        return interaction.reply({
            content: "❌ هذا الزر للمطور فقط.",
            ephemeral: true
        });

    await interaction.reply({
        content: "🛑 سيتم إيقاف البوت...",
        ephemeral: true
    });

    process.exit(0);
}

// ================= ANTI SPAM =================

if (interaction.isButton() && customId === "anti_spam") {

    return interaction.reply({
        content: config.antiSpam.enabled
            ? "🟢 نظام Anti-Spam مفعل."
            : "🔴 نظام Anti-Spam معطل.",
        ephemeral: true
    });
}

// ================= BAD WORDS =================

if (interaction.isButton() && customId === "bad_words") {

    return interaction.reply({
        content: `🚷 عدد الكلمات المحظورة: ${config.badWords.length}`,
        ephemeral: true
    });
}
        // ================= LOGS =================

if (interaction.isButton() && customId === "set_logs") {

    return interaction.reply({
        content: `📜 روم اللوقات الحالي:\n<#${
            config.logChannelId || "غير محدد"
        }>`,
        ephemeral: true
    });
}

// ================= IMAGE =================

if (interaction.isButton() && customId === "set_image") {

    const embed = new EmbedBuilder()
        .setTitle("🖼 صورة البوت")
        .setColor(config.embedColor)
        .setImage(config.image);

    return interaction.reply({
        embeds: [embed],
        ephemeral: true
    });
}

// ================= COLOR =================

if (interaction.isButton() && customId ===
    
