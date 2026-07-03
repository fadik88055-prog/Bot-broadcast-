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

        if (!interaction.isButton()) return;

        const { customId, member } = interaction;

        /* ================= CLOSE ================= */
        if (customId === "close_panel") {
            return interaction.update({
                content: "❌ تم إغلاق اللوحة",
                embeds: [],
                components: []
            });
        }

        /* ================= BROADCAST ================= */
        if (customId === "broadcast") {
            if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: "❌ ما عندك صلاحية", ephemeral: true });
            }

            return interaction.reply({ content: "📢 Broadcast Panel شغال", ephemeral: true });
        }

        /* ================= MODERATION ================= */
        if (customId === "moderation") {
            if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: "❌ ما عندك صلاحية", ephemeral: true });
            }

            return interaction.reply({ content: "👮 Moderation Panel شغال", ephemeral: true });
        }

        /* ================= STATS ================= */
        if (customId === "statistics") {
            return interaction.reply({
                content: `📊 Servers: ${client.guilds.cache.size}\n👥 Users: ${client.users.cache.size}`,
                ephemeral: true
            });
        }

        /* ================= PROTECTION ================= */
        if (customId === "protection") {
            return interaction.reply({ content: "🛡 Protection Panel", ephemeral: true });
        }

        /* ================= SETTINGS ================= */
        if (customId === "settings") {
            return interaction.reply({ content: "⚙ Settings Panel", ephemeral: true });
        }

        /* ================= DEVELOPER ================= */
        if (customId === "developer") {

            if (interaction.user.id !== config.ownerID) {
                return interaction.reply({ content: "❌ للمطور فقط", ephemeral: true });
            }

            return interaction.reply({ content: "👑 Developer Panel", ephemeral: true });
        }

        /* ================= BOT INFO ================= */
        if (customId === "bot_info") {
            return interaction.reply({
                content: `🤖 ${client.user.tag}\n📡 Ping: ${client.ws.ping}ms`,
                ephemeral: true
            });
        }

        /* ================= RELOAD ================= */
        if (customId === "reload_bot") {
            return interaction.reply({ content: "🔄 تم التحديث", ephemeral: true });
        }

        /* ================= SHUTDOWN ================= */
        if (customId === "shutdown_bot") {

            if (interaction.user.id !== config.ownerID) return;

            await interaction.reply({ content: "🛑 جاري الإيقاف...", ephemeral: true });
            process.exit(0);
        }

    }
};
