const config = require("./config.json");

module.exports = {
    name: "messageCreate",

    async execute(message, client) {

        if (!message.guild) return;
        if (message.author.bot) return;

        const content = message.content.toLowerCase();

        /* ===========================
           BAD WORD FILTER
        =========================== */

        const badWords = config.badWords || [];

        for (const word of badWords) {

            if (content.includes(word.toLowerCase())) {

                try {
                    await message.delete();
                } catch {}

                try {
                    await message.channel.send({
                        content: `🚫 ${message.author} لا تستخدم كلمات غير لائقة`
                    });
                } catch {}

                return;
            }

        }

        /* ===========================
           ANTI MENTION SPAM
        =========================== */

        if (message.mentions.everyone) {

            try {
                await message.delete();
            } catch {}

            return message.channel.send({
                content: `⚠️ ${message.author} ممنوع استخدام @everyone`
            });

        }

    }
};
