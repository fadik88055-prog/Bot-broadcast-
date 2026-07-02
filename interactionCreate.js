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

        /* ===========================
           BUTTON HANDLER
        =========================== */

        if (interaction.isButton()) {

            /* ❌ CLOSE PANEL */
            if (customId === "close_panel") {
                return interaction.update({
                    content: "❌ تم إغلاق اللوحة",
                    embeds: [],
                    components: []
                });
            }

            /* ===========================
               MODERATION PANEL
            =========================== */

            if (customId === "moderation") {

                if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({ content: "❌ ما عندك صلاحية", ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setTitle("👮 Moderation Panel")
                    .setColor(config.embedColor || 0x5865F2)
                    .setDescription("اختر العملية");

                const row = new ActionRowBuilder().addComponents(

                    new ButtonBuilder().setCustomId("kick_user").setLabel("👢 Kick").setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId("ban_user").setLabel("🔨 Ban").setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId("timeout_user").setLabel("⏱ Timeout").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId("clear_chat").setLabel("🗑 Clear").setStyle(ButtonStyle.Primary)

                );

                return interaction.reply({
                    embeds: [embed],
                    components: [row],
                    ephemeral: true
                });
            }

            /* ===========================
               PROTECTION PANEL
            =========================== */

            if (customId === "protection") {

                return interaction.reply({
                    content: "🛡 Protection System جاهز (فلتر + سبام + منشن)",
                    ephemeral: true
                });
            }

            /* ===========================
               SETTINGS PANEL
            =========================== */

            if (customId === "settings") {

                return interaction.reply({
                    content: "⚙ Settings Panel (قريباً توسعة كاملة)",
                    ephemeral: true
                });
            }

            /* ===========================
               LOGS VIEW
            =========================== */

            if (customId === "logs") {

                return interaction.reply({
                    content: "📜 Logs System جاهز (راح نربطه بملف خارجي لاحقاً)",
                    ephemeral: true
                });
            }

            /* ===========================
               STATISTICS
            =========================== */

            if (customId === "statistics") {

                const embed = new EmbedBuilder()
                    .setTitle("📊 Bot Stats")
                    .setColor(config.embedColor || 0x5865F2)
                    .addFields(
                        { name: "Servers", value: `${client.guilds.cache.size}`, inline: true },
                        { name: "Users", value: `${client.users.cache.size}`, inline: true },
                        { name: "Ping", value: `${client.ws.ping}ms`, inline: true }
                    );

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            /* ===========================
               MODERATION ACTIONS
            =========================== */

            // 👢 KICK
            if (customId === "kick_user") {

                const modal = {
                    title: "👢 Kick User",
                    custom_id: "kick_modal",
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
                };
client.logEvent({
    type: "KICK",
    user: userId,
    moderator: interaction.user.id
});
                return interaction.showModal(modal);
            }

            // 🔨 BAN
            if (customId === "ban_user") {

                const modal = {
                    title: "🔨 Ban User",
                    custom_id: "ban_modal",
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
                };
client.logEvent({
    type: "BAN",
    user: userId,
    moderator: interaction.user.id
});
                return interaction.showModal(modal);
            }

            // ⏱ TIMEOUT
            if (customId === "timeout_user") {

                const modal = {
                    title: "⏱ Timeout User",
                    custom_id: "timeout_modal",
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
                };
client.logEvent({
    type: "TIMEOUT",
    user: userId,
    moderator: interaction.user.id
});
                return interaction.showModal(modal);
            }

            // 🗑 CLEAR
            if (customId === "clear_chat") {

                await interaction.channel.bulkDelete(50).catch(() => null);

                return interaction.reply({
                    content: "🗑 تم حذف آخر 50 رسالة",
                    ephemeral: true
                });
            }
        }
client.logEvent({
    type: "CLEAR",
    channel: interaction.channel.id,
    moderator: interaction.user.id
});
        /* ===========================
           MODALS (MODERATION)
        =========================== */

        if (interaction.isModalSubmit()) {

            const userId = interaction.fields.getTextInputValue("user_id");

            const target = await guild.members.fetch(userId).catch(() => null);

            /* 👢 KICK */
            if (interaction.customId === "kick_modal") {

                if (!target) return interaction.reply({ content: "❌ المستخدم غير موجود", ephemeral: true });

                await target.kick("Panel Kick");

                return interaction.reply({
                    content: `👢 تم طرد <@${userId}>`,
                    ephemeral: true
                });
            }

            /* 🔨 BAN */
            if (interaction.customId === "ban_modal") {

                if (!target) return interaction.reply({ content: "❌ المستخدم غير موجود", ephemeral: true });

                await target.ban({ reason: "Panel Ban" });

                return interaction.reply({
                    content: `🔨 تم حظر <@${userId}>`,
                    ephemeral: true
                });
            }

            /* ⏱ TIMEOUT */
            if (interaction.customId === "timeout_modal") {

                if (!target) return interaction.reply({ content: "❌ المستخدم غير موجود", ephemeral: true });

                await target.timeout(10 * 60 * 1000, "Panel Timeout");

                return interaction.reply({
                    content: `⏱ تم كتم <@${userId}>`,
                    ephemeral: true
                });
            }
        }
    }
};
