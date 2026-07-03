const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField
} = require("discord.js");

const config = require("./config.json");

module.exports = {
    name: "interactionCreate",

    async execute(interaction, client) {

        const { customId, member, user, guild } = interaction;

        if (!guild) return;

        const logChannel = guild.channels.cache.get(config.logChannelId);

        /* ===========================
           BUTTONS
        =========================== */

        if (interaction.isButton()) {

            /* CLOSE PANEL */
            if (customId === "close_panel") {
                return interaction.update({
                    content: "❌ تم إغلاق اللوحة",
                    embeds: [],
                    components: []
                });
            }

            /* BROADCAST MENU */
            if (customId === "broadcast") {

                if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({ content: "❌ ما عندك صلاحية", ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setTitle("📢 Broadcast System")
                    .setColor(config.embedColor || 0x5865F2);

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

                return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
            }

            /* MODERATION PANEL */
            if (customId === "moderation") {

                if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({ content: "❌ ما عندك صلاحية", ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setTitle("👮 Moderation Panel")
                    .setColor(config.embedColor || 0x5865F2);

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("kick_user").setLabel("👢 Kick").setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId("ban_user").setLabel("🔨 Ban").setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId("timeout_user").setLabel("⏱ Timeout").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId("clear_chat").setLabel("🗑 Clear").setStyle(ButtonStyle.Primary)
                );

                return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
            }

            /* STATS */
        if (customId === "statistics") {

    const embed = new EmbedBuilder()
        .setTitle("📊 Stats")
        .setColor(config.embedColor || 0x5865F2)
        .addFields(
            { name: "Servers", value: `${client.guilds.cache.size}`, inline: true },
            { name: "Users", value: `${client.users.cache.size}`, inline: true },
            { name: "Ping", value: `${client.ws.ping}ms`, inline: true }
        );

    return interaction.reply({ embeds: [embed], ephemeral: true });
        }
            /* PROTECTION */

if (customId === "protection") {

    const embed = new EmbedBuilder()
        .setTitle("🛡 Protection")
        .setColor(config.embedColor || "#5865F2")
        .setDescription(
            "اختر النظام الذي تريد التحكم به."
        );

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
            /* SETTINGS */

if (customId === "settings") {

    const embed = new EmbedBuilder()
        .setTitle("⚙️ Settings")
        .setColor(config.embedColor || "#5865F2")
        .setDescription("اختر الإعداد الذي تريد تعديله.");

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
            /* DEVELOPER */

if (customId === "developer") {

    if (interaction.user.id !== config.ownerID) {
        return interaction.reply({
            content: "❌ هذا الزر للمطور فقط.",
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setTitle("👑 Developer Panel")
        .setColor(config.embedColor || "#5865F2")
        .setDescription("لوحة المطور.");

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
       /* BOT INFO */

if (customId === "bot_info") {

    const embed = new EmbedBuilder()
        .setTitle("🤖 معلومات البوت")
        .setColor(config.embedColor || "#5865F2")
        .addFields(
            {
                name: "📡 Ping",
                value: `${client.ws.ping}ms`,
                inline: true
            },
            {
                name: "🌍 Servers",
                value: `${client.guilds.cache.size}`,
                inline: true
            },
            {
                name: "👥 Users",
                value: `${client.users.cache.size}`,
                inline: true
            },
            {
                name: "🆔 Bot ID",
                value: client.user.id,
                inline: false
            }
        );

    return interaction.reply({
        embeds: [embed],
        ephemeral: true
    });

}
        /* RELOAD */

if (customId === "reload_bot") {

    if (interaction.user.id !== config.ownerID) {
        return interaction.reply({
            content: "❌ هذا الزر للمطور فقط.",
            ephemeral: true
        });
    }

    await interaction.reply({
        content: "🔄 تم إعادة تحميل البوت (تحديث اللوحة فقط).",
        ephemeral: true
    });

}
    /* SHUTDOWN */

if (customId === "shutdown_bot") {

    if (interaction.user.id !== config.ownerID) {
        return interaction.reply({
            content: "❌ هذا الزر للمطور فقط.",
            ephemeral: true
        });
    }

    await interaction.reply({
        content: "🛑 سيتم إيقاف البوت...",
        ephemeral: true
    });

    process.exit(0);
}
    /* ANTI SPAM */

if (customId === "anti_spam") {

    return interaction.reply({
        content: config.antiSpam.enabled
            ? "🟢 نظام Anti-Spam مفعل."
            : "🔴 نظام Anti-Spam معطل.",
        ephemeral: true
    });

}

/* BAD WORDS */

if (customId === "bad_words") {

    const embed = new EmbedBuilder()
        .setTitle("🚷 Bad Words")
        .setColor(config.embedColor || "#5865F2")
        .setDescription(
            `عدد الكلمات المحظورة: **${config.badWords.length}**`
        );

    return interaction.reply({
        embeds: [embed],
        ephemeral: true
    });

}
    /* LOGS */

if (customId === "set_logs") {

    return interaction.reply({
        content:
            `📜 روم اللوقات الحالي:\n<#${
                config.logChannelId || "غير محدد"
            }>`,
        ephemeral: true
    });

}

/* IMAGE */

if (customId === "set_image") {

    const embed = new EmbedBuilder()
        .setTitle("🖼 صورة البوت")
        .setColor(config.embedColor || "#5865F2")
        .setImage(config.image);

    return interaction.reply({
        embeds: [embed],
        ephemeral: true
    });

}

/* COLOR */

if (customId === "set_color") {

    return interaction.reply({
        content: `🎨 اللون الحالي: ${config.embedColor}`,
        ephemeral: true
    });

}
            /* BROADCAST MODALS */
            if (customId === "bc_dm" || customId === "bc_channel") {

                return interaction.showModal({
                    title: customId === "bc_dm" ? "DM Broadcast" : "Channel Broadcast",
                    custom_id: customId === "bc_dm" ? "bc_dm_modal" : "bc_channel_modal",
                    components: [{
                        type: 1,
                        components: [{
                            type: 4,
                            custom_id: "message",
                            label: "Message",
                            style: 2,
                            required: true
                        }]
                    }]
                });
            }

            /* MODERATION MODALS */
            if (["kick_user", "ban_user", "timeout_user"].includes(customId)) {

                return interaction.showModal({
                    title: "User ID",
                    custom_id: customId.replace("_user", "_modal"),
                    components: [{
                        type: 1,
                        components: [{
                            type: 4,
                            custom_id: "user_id",
                            label: "User ID",
                            style: 1,
                            required: true
                        }]
                    }]
                });
            }

            if (customId === "clear_chat") {

                await interaction.channel.bulkDelete(50).catch(() => {});

                if (logChannel) {
                    logChannel.send(`🗑 Clear by <@${interaction.user.id}>`).catch(() => {});
                }

                return interaction.reply({ content: "🗑 Done", ephemeral: true });
            }
        }

        /* ===========================
           MODALS
        =========================== */

        if (interaction.isModalSubmit()) {

            const guild = interaction.guild;

            /* DM BROADCAST */
            if (interaction.customId === "bc_dm_modal") {

                const message = interaction.fields.getTextInputValue("message");

                let success = 0;
                let failed = 0;

                const members = await guild.members.fetch();

                for (const m of members.values()) {
                    if (m.user.bot) continue;

                    try {
                        await m.send(`📢 ${message}`);
                        success++;
                    } catch {
                        failed++;
                    }
                }

                if (logChannel) {
                    logChannel.send(
                        `📢 DM BROADCAST\n👤 <@${interaction.user.id}>\n✅ ${success} ❌ ${failed}`
                    ).catch(() => {});
                }

                return interaction.reply({
                    content: `Done\n✅ ${success} ❌ ${failed}`,
                    ephemeral: true
                });
            }

            /* CHANNEL BROADCAST */
            if (interaction.customId === "bc_channel_modal") {

                const message = interaction.fields.getTextInputValue("message");

                await interaction.channel.send(`📢 ${message}`);

                if (logChannel) {
                    logChannel.send(
                        `📢 CHANNEL BROADCAST\n👤 <@${interaction.user.id}>`
                    ).catch(() => {});
                }

                return interaction.reply({ content: "Sent", ephemeral: true });
            }

            /* MODERATION */

            const userId = interaction.fields.getTextInputValue("user_id");
            const target = await guild.members.fetch(userId).catch(() => null);

            /* KICK */
            if (interaction.customId === "kick_modal") {

                if (!target) return interaction.reply({ content: "Not found", ephemeral: true });

                await target.kick();

                if (logChannel) {
                    logChannel.send(`👢 KICK <@${userId}> by <@${interaction.user.id}>`).catch(() => {});
                }

                return interaction.reply({ content: "Kicked", ephemeral: true });
            }

            /* BAN */
            if (interaction.customId === "ban_modal") {

                if (!target) return interaction.reply({ content: "Not found", ephemeral: true });

                await target.ban();

                if (logChannel) {
                    logChannel.send(`🔨 BAN <@${userId}> by <@${interaction.user.id}>`).catch(() => {});
                }

                return interaction.reply({ content: "Banned", ephemeral: true });
            }

            /* TIMEOUT */
            if (interaction.customId === "timeout_modal") {

                if (!target) return interaction.reply({ content: "Not found", ephemeral: true });

                await target.timeout(10 * 60 * 1000);

                if (logChannel) {
                    logChannel.send(`⏱ TIMEOUT <@${userId}> by <@${interaction.user.id}>`).catch(() => {});
                }

                return interaction.reply({ content: "Timeout done", ephemeral: true });
            }
        }
    }
};
