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

        const { customId, member, user } = interaction;

        /* ===========================
           BUTTONS
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

            /* ===========================
               MAIN BROADCAST MENU
            =========================== */

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

            /* ===========================
               MODERATION PANEL
            =========================== */

            if (customId === "moderation") {

                if (!member.permissions.has("Administrator")) {
                    return interaction.reply({
                        content: "❌ ما عندك صلاحية",
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder()
                    .setTitle("👮 Moderation Panel")
                    .setColor(config.embedColor || 0x5865F2)
                    .setDescription("اختر العملية:");

                const row = new ActionRowBuilder().addComponents(

                    new ButtonBuilder()
                        .setCustomId("kick_user")
                        .setLabel("👢 Kick")
                        .setStyle(ButtonStyle.Danger),

                    new ButtonBuilder()
                        .setCustomId("ban_user")
                        .setLabel("🔨 Ban")
                        .setStyle(ButtonStyle.Danger),

                    new ButtonBuilder()
                        .setCustomId("timeout_user")
                        .setLabel("⏱ Timeout")
                        .setStyle(ButtonStyle.Secondary),

                    new ButtonBuilder()
                        .setCustomId("clear_chat")
                        .setLabel("🗑 Clear")
                        .setStyle(ButtonStyle.Primary)

                );

                return interaction.reply({
                    embeds: [embed],
                    components: [row],
                    ephemeral: true
                });
            }

            /* ===========================
               PROTECTION / SETTINGS
            =========================== */

            if (customId === "protection") {
                return interaction.reply({
                    content: "🛡 الحماية قريباً",
                    ephemeral: true
                });
            }

            if (customId === "settings") {
                return interaction.reply({
                    content: "⚙ الإعدادات قريباً",
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

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            /* ===========================
               DEVELOPER PANEL
            =========================== */

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
               BROADCAST OPTIONS
            =========================== */

            if (customId === "bc_dm" || customId === "bc_channel") {

                const modal = {
                    title: customId === "bc_dm" ? "📨 DM Broadcast" : "📢 Channel Broadcast",
                    custom_id: customId === "bc_dm" ? "bc_dm_modal" : "bc_channel_modal",
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "message",
                                    label: "Message",
                                    style: 2,
                                    placeholder: "اكتب الرسالة هنا",
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
           MODALS (BROADCAST)
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
