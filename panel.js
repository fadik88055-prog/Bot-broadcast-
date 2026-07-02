const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");

const config = require("./config.json");

module.exports = {
    name: "panel",

    async execute(message, client) {

        if (!message.guild) return;

        if (!message.content.startsWith(config.prefix)) return;

        const args = message.content.slice(config.prefix.length).trim().split(/ +/g);

        const cmd = args.shift().toLowerCase();

        if (cmd !== "panel") return;

        // 🔐 صلاحية الأدمن
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ ما عندك صلاحية تستخدم اللوحة");
        }

        // 👑 تحديد إذا مطور
        const isOwner = message.author.id === config.ownerID;

        const embed = new EmbedBuilder()
            .setColor(config.embedColor || "#5865F2")
            .setTitle("🎛️ لوحة التحكم")
            .setDescription("اختار من الأزرار بالأسفل")
            .setThumbnail(config.image)
            .setFooter({ text: "Broadcast Dashboard Bot" });

        const row1 = new ActionRowBuilder().addComponents(

            new ButtonBuilder()
                .setCustomId("broadcast")
                .setLabel("📢 Broadcast")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("moderation")
                .setLabel("👮 Moderation")
                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
                .setCustomId("protection")
                .setLabel("🛡 Protection")
                .setStyle(ButtonStyle.Secondary)

        );

        const row2 = new ActionRowBuilder().addComponents(

            new ButtonBuilder()
                .setCustomId("settings")
                .setLabel("⚙ Settings")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId("statistics")
                .setLabel("📊 Statistics")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId("close_panel")
                .setLabel("❌ Close")
                .setStyle(ButtonStyle.Danger)

        );

        // 👑 زر المطور يظهر فقط للمالك
        if (isOwner) {

            const row3 = new ActionRowBuilder().addComponents(

                new ButtonBuilder()
                    .setCustomId("developer")
                    .setLabel("👑 Developer")
                    .setStyle(ButtonStyle.Primary)

            );

            return message.reply({
                embeds: [embed],
                components: [row1, row2, row3]
            });

        }

        // إذا مو مطور
        message.reply({
            embeds: [embed],
            components: [row1, row2]
        });

    }
};
