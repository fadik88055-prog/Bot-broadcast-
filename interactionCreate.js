const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const config = require("./config.json");

module.exports = {
    name: "interactionCreate",

    async execute(interaction, client) {

        if (!interaction.isButton()) return;

        const { customId, member, user, guild } = interaction;

        if (!guild) return;

        // 🔴 إغلاق اللوحة
        if (customId === "close_panel") {
            return interaction.update({
                content: "❌ تم إغلاق اللوحة",
                embeds: [],
                components: []
            });
        }

        // 📢 Broadcast
        if (customId === "broadcast") {

            if (!member.permissions.has("Administrator")) {
                return interaction.reply({
                    content: "❌ ما عندك صلاحية",
                    ephemeral: true
                });
            }

            return interaction.reply({
                content: "📢 اختر نوع البرودكاست (راح نكمله بالخطوة الجاية)",
                ephemeral: true
            });
        }

        // 👮 Moderation
        if (customId === "moderation") {

            if (!member.permissions.has("Administrator")) {
                return interaction.reply({
                    content: "❌ ما عندك صلاحية",
                    ephemeral: true
                });
            }

            return interaction.reply({
                content: "👮 قسم الإدارة (راح نكمله)",
                ephemeral: true
            });
        }

        // 🛡 Protection
        if (customId === "protection") {

            return interaction.reply({
                content: "🛡 قسم الحماية (فلتر سب + روابط + سبام)",
                ephemeral: true
            });
        }

        // ⚙ Settings
        if (customId === "settings") {

            return interaction.reply({
                content: "⚙ إعدادات السيرفر (لوق + برودكاست)",
                ephemeral: true
            });
        }

        // 📊 Statistics
        if (customId === "statistics") {

            const embed = new EmbedBuilder()
                .setColor(config.embedColor || "#5865F2")
                .setTitle("📊 Bot Statistics")
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

        // 👑 Developer Panel
        if (customId === "developer") {

            if (user.id !== config.ownerID) {
                return interaction.reply({
                    content: "⛔ هذا القسم للمطور فقط",
                    ephemeral: true
                });
            }

            return interaction.reply({
                content: "👑 Developer Panel (راح نكمله بعدين)",
                ephemeral: true
            });
        }

    }
};
