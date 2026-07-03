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

// دالة ذكية للبحث عن روم اللوق بالاسم داخل السيرفر الحالي
async function sendBotLog(guild, client, title, description, color = "#5865F2", fields = []) {
    const logChannel = guild.channels.cache.find(ch => ch.name === config.logChannelName);
    if (!logChannel) return; // إذا السيرفر ما فيه روم بهذا الاسم، يتخطى ولا يعطي خطأ

    const logEmbed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();

    if (fields.length > 0) logEmbed.addFields(fields);

    logChannel.send({ embeds: [logEmbed] }).catch(() => {});
}

module.exports = {
    name: "interactionCreate",

    async execute(interaction, client) {
        if (!interaction.guild) return;

        // ================= أمر السلاش /panel =================
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'panel') {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({ content: "❌ ما عندك صلاحية الإدارة لاستخدام اللوحة.", ephemeral: true });
                }

                const isOwner = interaction.user.id === config.ownerID;

                const embed = new EmbedBuilder()
                    .setColor(config.embedColor || "#5865F2")
                    .setTitle("🎛️ لوحة التحكم")
                    .setDescription("اختار من الأزرار بالأسفل لتشغيل النظام المطلوب")
                    .setThumbnail(config.image || null)
                    .setFooter({ text: `Server: ${interaction.guild.name}` });

                const row1 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("broadcast").setLabel("📢 Broadcast").setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId("moderation").setLabel("👮 Moderation").setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId("protection").setLabel("🛡 Protection").setStyle(ButtonStyle.Secondary)
                );

                const row2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("settings").setLabel("⚙ Settings").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId("statistics").setLabel("📊 Statistics").setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId("close_panel").setLabel("❌ Close").setStyle(ButtonStyle.Danger)
                );

                await sendBotLog(interaction.guild, client, "🔑 فتح لوحة التحكم", `قام المسؤول **${interaction.user.tag}** بطلب فتح اللوحة.`, "#5865F2");

                if (isOwner) {
                    const row3 = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId("developer").setLabel("👑 Developer").setStyle(ButtonStyle.Primary)
                    );
                    return interaction.reply({ embeds: [embed], components: [row1, row2, row3], ephemeral: true });
                }

                return interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
            }
            return;
        }

        if (!interaction.isButton() && !interaction.isModalSubmit()) return;
        const { customId } = interaction;

        // ❌ إغلاق اللوحة
        if (interaction.isButton() && customId === "close_panel") {
            await sendBotLog(interaction.guild, client, "❌ إغلاق لوحة التحكم", `تم إغلاق اللوحة بواسطة **${interaction.user.tag}**.`, "#727d8a");
            return interaction.update({ content: "❌ تم إغلاق لوحة التحكم بنجاح.", embeds: [], components: [] });
        }

        // 📢 خيارات الـ Broadcast
        if (interaction.isButton() && customId === "broadcast") {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle("📢 Broadcast System")
                .setDescription("اختار نوع البث المراد عمله:");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("bc_dm_modal").setLabel("📨 DM (الخاص مع منشن)").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("bc_channel_modal").setLabel("📢 Channel (بروم)").setStyle(ButtonStyle.Success)
            );
            return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }

        // ظهور الـ Modals للبرودكاست
        if (interaction.isButton() && (customId === "bc_dm_modal" || customId === "bc_channel_modal")) {
            const modal = new ModalBuilder()
                .setCustomId(customId === "bc_dm_modal" ? "send_bc_dm" : "send_bc_channel")
                .setTitle(customId === "bc_dm_modal" ? "بث رسائل خاص" : "بث رسالة داخل روم");

            const bcInput = new TextInputBuilder()
                .setCustomId("bc_text")
                .setLabel("اكتب نص البرودكاست هنا")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(bcInput));
            return await interaction.showModal(modal);
        }

        // معالجة نصوص البرودكاست
        if (interaction.isModalSubmit()) {
            const messageText = interaction.fields.getTextInputValue("bc_text");

            if (interaction.customId === "send_bc_dm") {
                await interaction.reply({ content: "⏳ جاري بدء إرسال البرودكاست الخاص للأعضاء مع المنشن...", ephemeral: true });
                let successCount = 0;
                const members = await interaction.guild.members.fetch();

                for (const [id, member] of members) {
                    if (member.user.bot) continue;
                    try {
                        await member.send({ content: `📢 **برودكاست جديد!**\n\n${messageText}\n\n${member}` });
                        successCount++;
                    } catch (err) {}
                }

                await sendBotLog(interaction.guild, client, "📨 تم إرسال برودكاست خاص (DM)", "تفاصيل العملية:", "#00FF00", [
                    { name: "👤 المسؤول المرسل:", value: `${interaction.user.tag}` },
                    { name: "💬 النص المرسل:", value: messageText },
                    { name: "📊 النتيجة:", value: `تم الإرسال لـ **${successCount}** عضو.` }
                ]);
                return interaction.followUp({ content: `✅ تم الإرسال بنجاح إلى ${successCount} عضو.`, ephemeral: true });
            }

            if (interaction.customId === "send_bc_channel") {
                await interaction.channel.send({ content: `📢 **إعلان هام (Broadcast):**\n\n${messageText}` });
                await interaction.reply({ content: "✅ تم نشر البرودكاست في هذه الروم.", ephemeral: true });

                await sendBotLog(interaction.guild, client, "📢 تم إرسال برودكاست في روم", "تفاصيل العملية:", "#00FF00", [
                    { name: "👤 المسؤول المرسل:", value: `${interaction.user.tag}` },
                    { name: "📍 الروم:", value: `${interaction.channel}` },
                    { name: "💬 النص المعلن:", value: messageText }
                ]);
                return;
            }
        }

        // الإحصائيات 📊
        if (interaction.isButton() && customId === "statistics") {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle("📊 Statistics")
                .addFields(
                    { name: " Servers", value: `${client.guilds.cache.size}`, inline: true },
                    { name: "👥 Users", value: `${client.users.cache.size}`, inline: true },
                    { name: "📡 Ping", value: `${client.ws.ping}ms`, inline: true }
                );
            await sendBotLog(interaction.guild, client, "📊 استعلام إحصائيات", `قام **${interaction.user.tag}** برؤية الإحصائيات.`, "#00aeff");
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // الحماية 🛡
        if (interaction.isButton() && customId === "protection") {
            const embed = new EmbedBuilder().setColor(config.embedColor).setTitle("🛡 Protection Status");
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("anti_spam").setLabel("🚫 Anti Spam").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("bad_words").setLabel("🚷 Bad Words").setStyle(ButtonStyle.Secondary)
            );
            return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }

        if (interaction.isButton() && customId === "anti_spam") {
            return interaction.reply({ content: config.antiSpam.enabled ? "🟢 نظام **Anti-Spam** مفعل." : "🔴 نظام **Anti-Spam** معطل.", ephemeral: true });
        }

        if (interaction.isButton() && customId === "bad_words") {
            return interaction.reply({ content: `🚷 عدد الكلمات المحظورة بالملف: **${config.badWords.length}** كلمة.`, ephemeral: true });
        }

        // الإعدادات ⚙
        if (interaction.isButton() && customId === "settings") {
            const embed = new EmbedBuilder().setColor(config.embedColor).setTitle("⚙️ Bot Settings");
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("set_logs").setLabel("📜 Logs Name").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("set_image").setLabel("🖼 Image").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("set_color").setLabel("🎨 Color").setStyle(ButtonStyle.Success)
            );
            return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }

        if (interaction.isButton() && customId === "set_logs") {
            return interaction.reply({ content: `📜 اسم روم السجلات المطلوبة في أي سيرفر: \`${config.logChannelName}\``, ephemeral: true });
        }

        if (interaction.isButton() && customId === "set_image") {
            const embed = new EmbedBuilder().setTitle("🖼 صورة البوت").setColor(config.embedColor).setImage(config.image);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (interaction.isButton() && customId === "set_color") {
            return interaction.reply({ content: `🎨 لون الـ Embed المعتمد: \`${config.embedColor || "غير محدد"}\``, ephemeral: true });
        }

        // المطور 👑
        if (interaction.isButton() && customId === "developer") {
            if (interaction.user.id !== config.ownerID) return interaction.reply({ content: "❌ هذا الزر للمطور فقط.", ephemeral: true });
            const embed = new EmbedBuilder().setColor(config.embedColor).setTitle("👑 Developer Panel");
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("bot_info").setLabel("🤖 Bot Info").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("reload_bot").setLabel("🔄 Reload").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("shutdown_bot").setLabel("🛑 Shutdown").setStyle(ButtonStyle.Danger)
            );
            return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }

        if (interaction.isButton() && customId === "bot_info") {
            const embed = new EmbedBuilder().setColor(config.embedColor).setTitle("🤖 معلومات البوت")
                .addFields(
                    { name: "📡 Ping", value: `${client.ws.ping}ms`, inline: true },
                    { name: "🌍 Servers", value: `${client.guilds.cache.size}`, inline: true },
                    { name: "👥 Users", value: `${client.users.cache.size}`, inline: true }
                );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (interaction.isButton() && customId === "reload_bot") {
            await sendBotLog(interaction.guild, client, "🔄 تحديث البوت", `قام المطور **${interaction.user.tag}** بعمل ريلود للوحة.`, "#FFFF00");
            return interaction.reply({ content: "✅ تم تحديث اللوحة بنجاح.", ephemeral: true });
        }

        if (interaction.isButton() && customId === "shutdown_bot") {
            await sendBotLog(interaction.guild, client, "🛑 إغلاق البوت", `قام المطور **${interaction.user.tag}** بإطفاء البوت.`, "#FF0000");
            await interaction.reply({ content: "🛑 سيتم إيقاف البوت وفصل العمل...", ephemeral: true });
            process.exit(0);
        }

        // أزرار المشرفين 👮
        if (interaction.isButton() && customId === "moderation") {
            const embed = new EmbedBuilder().setColor(config.embedColor).setTitle("👮 Moderation Control");
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("kick_user").setLabel("Kick").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId("ban_user").setLabel("Ban").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId("timeout_user").setLabel("Timeout").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("clear_chat").setLabel("Clear Chat").setStyle(ButtonStyle.Primary)
            );
            return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }

        if (interaction.isButton() && ["kick_user", "ban_user", "timeout_user", "clear_chat"].includes(customId)) {
            await sendBotLog(interaction.guild, client, "👮 ضغطة زر إشراف", `قام **${interaction.user.tag}** بالضغط على زر الإشراف: \`${customId}\`.`, "#Orange");
            return interaction.reply({ content: `🛠️ تم استقبال كبسة زر الإشراف **(${customId})** وجاري معالجتها.`, ephemeral: true });
        }
    }
};
