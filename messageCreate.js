const { EmbedBuilder } = require("discord.js");
const config = require("./config.json");

module.exports = {
    name: "messageCreate",

    async execute(message, client) {
        if (!message.guild) return;
        if (message.author.bot) return;

        const content = message.content.toLowerCase();
        const logChannel = message.guild.channels.cache.find(ch => ch.name === config.logChannelName);

        // فلتر الكلمات البذيئة 🚷
        const badWords = config.badWords || [];
        for (const word of badWords) {
            if (content.includes(word.toLowerCase())) {
                try { await message.delete(); } catch {}
                try { await message.channel.send({ content: `🚫 ${message.author} لا تستخدم كلمات غير لائقة` }); } catch {}

                if (logChannel) {
                    const embedLog = new EmbedBuilder()
                        .setColor("#FF0000")
                        .setTitle("⚠️ رصد كلمة ممنوعة")
                        .addFields(
                            { name: "👤 العضو:", value: `${message.author.tag} (${message.author.id})`, inline: true },
                            { name: "📍 الروم:", value: `${message.channel}`, inline: true },
                            { name: "📝 الرسالة المحذوفة:", value: `||${message.content}||` }
                        )
                        .setTimestamp();
                    logChannel.send({ embeds: [embedLog] }).catch(() => {});
                }
                return;
            }
        }

        // منع سبام المنشن ⚠️
        if (message.mentions.everyone) {
            try { await message.delete(); } catch {}
            try { await message.channel.send({ content: `⚠️ ${message.author} ممنوع استخدام @everyone` }); } catch {}

            if (logChannel) {
                const embedLog = new EmbedBuilder()
                    .setColor("#FFA500")
                    .setTitle("⚠️ تاغ إيفري وان محظور")
                    .addFields(
                        { name: "👤 العضو:", value: `${message.author.tag}`, inline: true },
                        { name: "📍 الروم:", value: `${message.channel}`, inline: true }
                    )
                    .setTimestamp();
                logChannel.send({ embeds: [embedLog] }).catch(() => {});
            }
        }
    }
};
