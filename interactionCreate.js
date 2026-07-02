const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const config = require("./config.json");
const broadcast = require("./broadcast");

module.exports = {
    name: "interactionCreate",

    async execute(interaction, client) {

        const { customId, member, user } = interaction;

        /* ===========================
           BUTTONS ONLY
        =========================== */

        if (interaction.isButton()) {

            // ❌ Close Panel
            if (customId === "close_panel") {

                return interaction.update({
                    content: "❌ تم إغلاق اللوحة",
                    embeds: [],
                    components: []
                });

            }

            // 📢 BROADCAST PANEL
            if (customId === "broadcast") {

                if (!member.permissions.has("Administrator")) {
                    return interaction.reply({
                        content: "❌ ما عندك صلاحية",
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder()
                    .setTitle("📢 Broadcast System")
                    .setColor(config.embedColor || 0x5865F2)
                    .setDescription("اختار نوع البرودكاست");

                const row = new ActionRowBuilder().addComponents(

                    new ButtonBuilder()
                        .setCustomId("bc_dm")
                        .setLabel("📨 DM Broadcast")
                        .setStyle(ButtonStyle.Primary),

                    new ButtonBuilder()
                        .setCustomId("bc_channel")
                        .setLabel("📢 Channel Broadcast")
                        .setStyle(ButtonStyle.Success)

                );

                return interaction.reply({
                    embeds: [embed],
                    components: [row],
                    ephemeral: true
                });
            }

            // 👮 Moderation (مؤقت)
            if (customId === "moderation") {

                if (!member.permissions.has("Administrator")) {
                    return interaction.reply({
                        content: "❌ ما عندك صلاحية",
                        ephemeral: true
                    });
                }

                return interaction.reply({
                    content: "👮 قريباً سيتم إضافة الموديريشن",
                    ephemeral: true
                });

            }

            // 🛡 Protection
            if (customId === "protection") {

                return interaction.reply({
                    content: "🛡 قسم الحماية قريباً",
                    ephemeral: true
                });

            }

            // ⚙ Settings
            if (customId === "settings") {

                return interaction.reply({
                    content: "⚙ الإعدادات قريباً",
                    ephemeral: true
                });

            }

            // 📊 Statistics
            if (customId === "statistics") {

                const embed = new EmbedBuilder()
                    .setColor(config.embedColor || 0x5865F2)
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

            // 👑 Developer
            if (customId === "developer") {

                if (user.id !== config.ownerID) {
                    return interaction.reply({
                        content: "⛔ للمطور فقط",
                        ephemeral: true
                    });
                }

                return interaction.reply({
                    content: "👑 Developer Panel قريباً",
                    ephemeral: true
                });

            }

            /* ===========================
               BROADCAST TYPE SELECT
            =========================== */

            if (customId === "bc_dm") {

                const modal = {
                    title: "📨 DM Broadcast",
                    custom_id: "bc_dm_modal",
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "message",
                                    label: "Message",
                                    style: 2,
                                    placeholder: "اكتب الرسالة",
                                    required: true
                                }
                            ]
                        }
                    ]
                };

                return interaction.showModal(modal);
            }

            if (customId === "bc_channel") {

                const modal = {
                    title: "📢 Channel Broadcast",
                    custom_id: "bc_channel_modal",
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "message",
                                    label: "Message",
                                    style: 2,
                                    placeholder: "اكتب الرسالة",
                                    required: true
                                }
                            ]
                        }
                    ]
                };

                return interaction.showModal(modal);
            }

        }

        /* ===========================
           MODALS
        =========================== */

        if (interaction.isModalSubmit()) {

            const message = interaction.fields.getTextInputValue("message");

            // 📨 DM BROADCAST
            if (interaction.customId === "bc_dm_modal") {

                const guild = interaction.guild;

                let success = 0;
                let failed = 0;

                const members = await guild.members.fetch();

                for (const member of members.values()) {

                    if (member.user.bot) continue;

                    try {
                        await member.send(`📢 Broadcast:\n\n${message}`);
                        success++;
                    } catch {
                        failed++;
                    }

                }

                return interaction.reply({
                    content: `✅ DM Broadcast Done\n📨 ${success}\n❌ ${failed}`,
                    ephemeral: true
                });

            }

            // 📢 CHANNEL BROADCAST
            if (interaction.customId === "bc_channel_modal") {

                await interaction.channel.send(`📢 Broadcast:\n\n${message}`);

                return interaction.reply({
                    content: "✅ تم الإرسال في الروم",
                    ephemeral: true
                });

            }

        }

    }
};
